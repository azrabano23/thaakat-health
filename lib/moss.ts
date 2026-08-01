// Moss real-time retrieval (<10ms), with a local fallback so the demo NEVER hard-fails.
// Use Moss RETRIEVAL-HEAVY: many small lookups per turn (criteria + history + imaging signals).
// SDK shape per Moss docs: new MossClient(projectId, projectKey) -> createIndex/loadIndex/query.
// We verify the exact call at the event; the local fallback keeps everything working meanwhile.

import { ENDO_CRITERIA, type CriterionDoc } from './criteria';

const INDEX = 'thaakat-endo-criteria';
let mossLoaded = false;
let mossClient: any = null;

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
      // one-time: ensure the criteria index exists + is loaded in-process
      try {
        await mossClient.createIndex(
          INDEX,
          ENDO_CRITERIA.map((c) => ({ id: c.id, text: c.text, metadata: { tags: c.tags } })),
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
function localRank(query: string, topK: number): CriterionDoc[] {
  const q = new Set(tokenize(query));
  return ENDO_CRITERIA.map((c) => {
    const toks = tokenize(c.text + ' ' + c.tags.join(' ') + ' ' + (c.followUp ?? ''));
    let overlap = 0;
    for (const t of toks) if (q.has(t)) overlap++;
    return { c, score: overlap / Math.sqrt(toks.length || 1) };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.c);
}

export async function retrieveCriteria(query: string, topK = 4): Promise<CriterionDoc[]> {
  const moss = await getMoss();
  if (moss) {
    try {
      const results: any = await moss.query(INDEX, query, { topK, alpha: 0.8 });
      const items: any[] = results?.results ?? results?.matches ?? results ?? [];
      const byId = new Map(ENDO_CRITERIA.map((c) => [c.id, c]));
      const mapped = items.map((r) => byId.get(r.id ?? r.documentId)).filter(Boolean) as CriterionDoc[];
      if (mapped.length) return mapped;
    } catch (e) {
      console.warn('[moss] query failed, using local fallback:', (e as Error).message);
    }
  }
  return localRank(query, topK);
}

export function usingMoss(): boolean {
  return !!(process.env.MOSS_PROJECT_ID && process.env.MOSS_PROJECT_KEY);
}
