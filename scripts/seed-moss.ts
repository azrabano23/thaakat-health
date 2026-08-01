// Provision the Moss index this app queries: `pnpm seed:moss`.
//
// Index creation is a server-side build that takes a while and is idempotent only in the sense
// that re-running it after a delete works. It does NOT belong in a request handler — doing it
// there meant a failed build surfaced as a silent local-fallback instead of an error anyone
// could see, so "Moss" was never actually serving a query.
//
// Run this once per project, and again whenever lib/criteria.ts or a seeded patient's record
// changes (the corpus is derived from both).

import { MOSS_INDEX, corpusDocuments } from '../lib/moss';
import { loadEnv } from './env';

loadEnv();

async function main() {
  const id = process.env.MOSS_PROJECT_ID;
  const key = process.env.MOSS_PROJECT_KEY;
  if (!id || !key) {
    console.error('MOSS_PROJECT_ID / MOSS_PROJECT_KEY are not set. See .env.example.');
    process.exit(1);
  }

  const { MossClient } = await import('@moss-dev/moss');
  const client = new MossClient(id, key);
  const docs = corpusDocuments();

  try {
    const existing = await client.listIndexes();
    if (existing.some((i: { name: string }) => i.name === MOSS_INDEX)) {
      // createIndex throws when the name is taken, so replace rather than fail. The corpus is
      // small and fully derived from the repo — there is nothing in the cloud copy to preserve.
      console.log(`Index "${MOSS_INDEX}" already exists — deleting so it can be rebuilt.`);
      await client.deleteIndex(MOSS_INDEX);
    }

    console.log(`Building "${MOSS_INDEX}" from ${docs.length} documents…`);
    await client.createIndex(MOSS_INDEX, docs, {
      onProgress: (p: { status: string; progress: number }) => console.log(`  ${p.status} ${p.progress}%`),
    });

    // Prove the thing the demo actually depends on, rather than trusting "created".
    await client.loadIndex(MOSS_INDEX);
    const t0 = Date.now();
    const result = await client.query(MOSS_INDEX, 'cyclical pelvic pain elevated CA-125 never followed up', {
      topK: 4,
    });
    const ms = Date.now() - t0;

    console.log(`\nReady. In-memory query took ${ms}ms:`);
    for (const d of result.docs) console.log(`  ${d.score?.toFixed(3)}  ${d.id}`);
  } finally {
    await client.close?.();
  }
}

main().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
