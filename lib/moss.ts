// Moss real-time retrieval (<10ms), with a local fallback so the demo NEVER hard-fails.
// Use Moss RETRIEVAL-HEAVY: many small lookups per turn (criteria + history + imaging signals).
// SDK shape per Moss docs: new MossClient(projectId, projectKey) -> createIndex/loadIndex/query.
// We verify the exact call at the event; the local fallback keeps everything working meanwhile.
//
// The corpus is BOTH halves of what Thaakat needs to ask a chart-aware question:
//   - the diagnostic criteria (what signals matter), and
//   - every finding in the patient's own longitudinal record (what her chart already documented).
// Indexing only the criteria makes "I can see a CA-125 nobody followed up" a hardcoded string
// rather than something retrieval actually surfaced — which is the entire chart-aware claim.

import { ENDO_CRITERIA, type CriterionDoc } from './criteria';
import { DEMO_PATIENTS, type Finding } from './clusters';

// Distinct from a criteria-only index: this corpus holds criteria AND patient records, so it
// must not reuse a name an older index may already occupy.
export const MOSS_INDEX = 'thaakat-context-v1';
// A single in-flight promise, not a boolean. Concurrent callers must share one loadIndex —
// with a flag, every request that arrives during the ~1.5s cold start starts its own index
// download, and the retrieval-heavy design means several arrive per turn.
let mossReady: Promise<any | null> | null = null;

export type ContextDoc =
  | { kind: 'criterion'; id: string; text: string; tags: string[]; followUp?: string }
  | { kind: 'record'; id: string; text: string; tags: string[]; patientId: string; finding: Finding };

// ── the corpus: criteria + every seeded patient's record, one flat index ──
function buildCorpus(): ContextDoc[] {
  const criteria: ContextDoc[] = ENDO_CRITERIA.map((c: CriterionDoc) => ({
    kind: 'criterion',
    id: `crit:${c.id}`,
    text: c.text,
    tags: c.tags,
    followUp: c.followUp,
  }));

  const records: ContextDoc[] = DEMO_PATIENTS.flatMap((p) =>
    p.record.map((f) => ({
      kind: 'record' as const,
      id: `rec:${p.id}:${f.id}`,
      // what gets embedded: the documented text plus how it was filed and whether it was dropped
      text: `${f.label}. ${f.detail} (${f.specialty}, ${f.date}${f.orphaned ? ', never followed up' : ''})`,
      tags: f.tags,
      patientId: p.id,
      finding: f,
    })),
  );

  return [...criteria, ...records];
}

export const CORPUS = buildCorpus();
const BY_ID = new Map(CORPUS.map((d) => [d.id, d]));

/** What gets uploaded to Moss. `DocumentInfo` is `{ id, text }` — there is no metadata field, */
/*  so scoping and tags are resolved locally from BY_ID after the query returns. */
export function corpusDocuments(): { id: string; text: string }[] {
  return CORPUS.map((d) => ({ id: d.id, text: d.text }));
}

async function connect(id: string, key: string): Promise<any | null> {
  try {
    // dynamic import so the app builds even before @moss-dev/moss is installed
    const mod: any = await import('@moss-dev/moss').catch(() => null);
    if (!mod) return null;
    const MossClient = mod.MossClient ?? mod.default?.MossClient ?? mod.default;
    const client = new MossClient(id, key);

    // loadIndex pulls the index and the embedding model into memory so query() runs locally
    // (~2-3ms) instead of round-tripping to the cloud (~100-500ms). The sub-10ms claim depends
    // entirely on this call having happened.
    //
    // Creating the index is NOT done here. It's a server-side build, and doing it inside a
    // request handler meant a failure surfaced as a silent fallback rather than an error anyone
    // could see. Provision it once with `pnpm seed:moss`.
    await client.loadIndex(MOSS_INDEX);
    return client;
  } catch (e) {
    const msg = (e as Error).message;
    console.warn(
      '[moss] falling back to local retrieval: %s%s',
      msg,
      /not found/i.test(msg) ? ` — run \`pnpm seed:moss\` to build "${MOSS_INDEX}".` : '',
    );
    return null;
  }
}

/**
 * Resolve the loaded Moss client, or null to use the local fallback.
 * Exported so a warm-up can pay the cold start before the demo's first question.
 */
export function getMoss(): Promise<any | null> {
  const id = process.env.MOSS_PROJECT_ID;
  const key = process.env.MOSS_PROJECT_KEY;
  if (!id || !key) return Promise.resolve(null);
  // Retry on a later request if this attempt failed, but never run two loads at once.
  mossReady ??= connect(id, key).then((c) => {
    if (!c) mossReady = null;
    return c;
  });
  return mossReady;
}

// --- local fallback: instant token-overlap similarity (no network, no embedding API) ---
function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function localRank(query: string, pool: ContextDoc[], topK: number): ContextDoc[] {
  const q = new Set(tokenize(query));
  return pool
    .map((d) => {
      const toks = tokenize(d.text + ' ' + d.tags.join(' ') + ' ' + (d.kind === 'criterion' ? d.followUp ?? '' : ''));
      let overlap = 0;
      for (const t of toks) if (q.has(t)) overlap++;
      return { d, score: overlap / Math.sqrt(toks.length || 1) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.d);
}

// A record doc is only visible to the patient it belongs to. Criteria are always in scope.
function inScope(d: ContextDoc, patientId?: string): boolean {
  return d.kind === 'criterion' || !patientId || d.patientId === patientId;
}

// Timing is reported as two separate numbers on purpose. Sri (Moss) will ask precisely where
// retrieval happens, and the playbook's own "what loses this panel" list includes quoting a
// latency you can't reproduce live. So:
//   retrievalMs — the moss.query() call itself. This is the number we claim on stage.
//   totalMs     — the whole server-side handler, which also includes the Next server -> Moss
//                 network hop. Always larger. Never quote this as "Moss latency".
export type RetrievalResult = {
  docs: ContextDoc[];
  retrievalMs: number;
  totalMs: number;
  backend: 'moss' | 'local-fallback';
};

export async function retrieveContextTimed(
  query: string,
  opts: { topK?: number; patientId?: string } = {},
): Promise<RetrievalResult> {
  const t0 = Date.now();
  const topK = opts.topK ?? 4;
  const pool = CORPUS.filter((d) => inScope(d, opts.patientId));

  const moss = await getMoss();
  if (moss) {
    try {
      // Over-fetch, then scope down locally: Moss documents carry no metadata, so per-patient
      // scoping is ours to do. `alpha` is the hybrid keyword/semantic mix (SDK default 0.8).
      const q0 = Date.now();
      const result: any = await moss.query(MOSS_INDEX, query, { topK: topK * 4, alpha: 0.8 });
      const retrievalMs = Date.now() - q0;
      // SearchResult is `{ query, docs }`. Reading `.results`/`.matches` here silently produced
      // a non-array and threw into the fallback, so Moss never served a single query.
      const items: any[] = Array.isArray(result?.docs) ? result.docs : [];
      const mapped = items
        .map((r) => BY_ID.get(r.id))
        .filter((d): d is ContextDoc => !!d && inScope(d, opts.patientId))
        .slice(0, topK);
      if (mapped.length) {
        return { docs: mapped, retrievalMs, totalMs: Date.now() - t0, backend: 'moss' };
      }
    } catch (e) {
      console.warn('[moss] query failed, using local fallback:', (e as Error).message);
    }
  }

  const l0 = Date.now();
  const docs = localRank(query, pool, topK);
  return { docs, retrievalMs: Date.now() - l0, totalMs: Date.now() - t0, backend: 'local-fallback' };
}

export async function retrieveContext(
  query: string,
  opts: { topK?: number; patientId?: string } = {},
): Promise<ContextDoc[]> {
  return (await retrieveContextTimed(query, opts)).docs;
}

// Criteria-only lookup, for callers that want the raw CriterionDoc shape.
export async function retrieveCriteria(query: string, topK = 4): Promise<CriterionDoc[]> {
  const docs = await retrieveContext(query, { topK: topK * 2 });
  const byId = new Map(ENDO_CRITERIA.map((c) => [c.id, c]));
  return docs
    .filter((d) => d.kind === 'criterion')
    .map((d) => byId.get(d.id.replace(/^crit:/, '')))
    .filter((c): c is CriterionDoc => !!c)
    .slice(0, topK);
}

export function usingMoss(): boolean {
  return !!(process.env.MOSS_PROJECT_ID && process.env.MOSS_PROJECT_KEY);
}

// Start the load as soon as this module is imported, so the cold start overlaps with whatever
// else the server is doing rather than landing on the first question. Fire-and-forget: callers
// await the same shared promise, so this only ever moves the cost earlier, never duplicates it.
void getMoss().catch(() => {});
