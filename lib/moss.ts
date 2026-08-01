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
const INDEX = 'thaakat-context-v1';
let mossLoaded = false;
let mossClient: any = null;

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

const CORPUS = buildCorpus();
const BY_ID = new Map(CORPUS.map((d) => [d.id, d]));

async function getMoss(): Promise<any | null> {
  const id = process.env.MOSS_PROJECT_ID;
  const key = process.env.MOSS_PROJECT_KEY;
  if (!id || !key) return null;
  if (mossClient) return mossClient;
  try {
    // dynamic import so the app builds even before @moss-dev/moss is installed
    const mod: any = await import('@moss-dev/moss').catch(() => null);
    if (!mod) return null;
    const MossClient = mod.MossClient ?? mod.default?.MossClient ?? mod.default;
    mossClient = new MossClient(id, key);
    if (!mossLoaded) {
      // one-time: ensure the corpus index exists + is loaded in-process
      try {
        await mossClient.createIndex(
          INDEX,
          CORPUS.map((d) => ({
            id: d.id,
            text: d.text,
            metadata: { kind: d.kind, tags: d.tags, patientId: d.kind === 'record' ? d.patientId : undefined },
          })),
        );
      } catch {
        /* index may already exist */
      }
      await mossClient.loadIndex(INDEX);
      mossLoaded = true;
    }
    return mossClient;
  } catch (e) {
    console.warn('[moss] falling back to local retrieval:', (e as Error).message);
    return null;
  }
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
      // over-fetch, then scope down — Moss metadata filtering shape gets confirmed at the event
      const q0 = Date.now();
      const results: any = await moss.query(INDEX, query, { topK: topK * 4, alpha: 0.8 });
      const retrievalMs = Date.now() - q0;
      const items: any[] = results?.results ?? results?.matches ?? results ?? [];
      const mapped = items
        .map((r) => BY_ID.get(r.id ?? r.documentId))
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
