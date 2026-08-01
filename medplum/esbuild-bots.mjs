// Bundles each Medplum Bot into a single deployable .js file.
//
// This exists because Medplum runs ONE file per bot on its own infra (not Vercel), and our bots
// import shared app code — `medplum/bots/intake-to-fhir.ts` pulls in `lib/fhir/model.ts` so the
// bot and the web app write the exact same FHIR shapes. `tsc` alone would emit a bare `require`
// for that import and the bot would crash at runtime, so we bundle instead.
//
// Mirrors packages/../examples/medplum-demo-bots/esbuild-script.mjs in the Medplum repo, including
// the `footer` below, which VM-context bots need in order to export their handler.

import botLayer from '@medplum/bot-layer/package.json' with { type: 'json' };
import esbuild from 'esbuild';
import fastGlob from 'fast-glob';

// Paths are relative to `medplum/` — the Medplum CLI reads medplum.config.json from its working
// directory and resolves `source`/`dist` against it, so every bot script runs from here.
const entryPoints = fastGlob.sync('./bots/**/*.ts').filter((f) => !f.endsWith('.test.ts'));

if (entryPoints.length === 0) {
  console.error('No bots found under medplum/bots/ — nothing to build.');
  process.exit(1);
}

// Everything the Medplum bot layer already provides at runtime stays external, so each bundle
// carries only OUR code.
const external = [...Object.keys(botLayer.dependencies), '@aws-sdk/client-*'];

await esbuild
  .build({
    entryPoints,
    bundle: true,
    outdir: './dist',
    platform: 'node',
    loader: { '.ts': 'ts' },
    resolveExtensions: ['.ts', '.js'],
    external,
    format: 'cjs',
    target: 'es2020',
    tsconfig: 'tsconfig.bots.json',
    // Required for VM Context Bots — without it Medplum can't find the exported handler.
    footer: { js: 'Object.assign(exports, module.exports);' },
  })
  .catch((error) => {
    console.error('Bot build failed:', error);
    process.exit(1);
  });

console.log(`Built ${entryPoints.length} bot(s) to medplum/dist/`);
