// Seed a REAL Medplum project with Maria's synthetic longitudinal record (a transaction Bundle).
// Run: fill .env.local (MEDPLUM_CLIENT_ID/SECRET), then `pnpm seed`.
// Demonstrates FHIR breadth judges care about: Patient, Coverage, Encounter (5 specialties),
// Observation (incl. the orphaned CA-125), DiagnosticReport + ImagingStudy (the under-read MRI),
// and Provenance. Synthetic data only.
import './websocket-polyfill'; // must precede @medplum/core — see that file
import { randomUUID } from 'node:crypto';
import { MedplumClient, createReference } from '@medplum/core';
import type { Bundle } from '@medplum/fhirtypes';
import { loadEnv } from './env';
import { demoPatientIdentifier, findDemoPatient, identifierSearchValue } from '../lib/demo-identity';
import { COVERAGE_SYSTEM, PAYERS, PAYER_SYSTEM } from '../lib/fhir/coverage';

// Reads .env then .env.local, ignoring empty values — see scripts/env.ts for why that matters.
loadEnv();

const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
const id = process.env.MEDPLUM_CLIENT_ID;
const secret = process.env.MEDPLUM_CLIENT_SECRET;

// FHIR requires a `urn:uuid:` fullUrl to be an actual UUID — Medplum matches it against
// /urn:uuid:[0-9a-f]{8}-.../ (packages/fhir-router/src/batch.ts). Readable placeholders like
// "urn:uuid:patient" do not match, so the server never resolves them: an earlier run of this script
// wrote 14 resources whose `subject` stayed the literal string "urn:uuid:patient", attached to no
// patient at all. Map each readable key to a real UUID and the transaction resolves every ref.
const localRef = (() => {
  const assigned = new Map<string, string>();
  return (key: string) => {
    const existing = assigned.get(key);
    if (existing) return existing;
    const ref = `urn:uuid:${randomUUID()}`;
    assigned.set(key, ref);
    return ref;
  };
})();

const P = localRef('patient');
const encRef = (n: string) => localRef(`enc-${n}`);

// `ifNoneExist` makes the entry a conditional create: the server reuses a matching resource instead
// of writing a second one, and still resolves this entry's urn:uuid to whichever it used.
function entry(fullUrl: string, resource: any, ifNoneExist?: string) {
  return {
    fullUrl,
    resource,
    request: { method: 'POST' as const, url: resource.resourceType, ifNoneExist },
  };
}

// The demo id in lib/clusters.ts. commitChart() resolves the Patient by this same identifier, so
// the assembled picture lands on this chart rather than on a fresh empty one.
const MARIA_IDENTIFIER = demoPatientIdentifier('maria');

// Maria's payer, kept in one place so the seeded Coverage and the live Stedi call cannot drift.
const MARIA_PAYER = PAYERS.uhc;

const bundle: Bundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [
    entry(
      P,
      { resourceType: 'Patient', identifier: [MARIA_IDENTIFIER], name: [{ given: ['Maria'], family: 'Doe' }], gender: 'female', birthDate: '1994-05-02' },
      `identifier=${identifierSearchValue(MARIA_IDENTIFIER)}`,
    ),
    // Maria prices against the UHC test payer (lib/clusters.ts: payer: 'uhc'), so her Coverage has
    // to name UnitedHealthcare. It previously said AETNA12345 / "Aetna (test)" — her chart and her
    // insurer disagreed, and `payor` was a display-only stub pointing at no Organization at all.
    // Only the UHC test payer returns authOrCertIndicator, which is what drives the prior-auth beat.
    entry(localRef('payer-org'), {
      resourceType: 'Organization', active: true,
      identifier: [{ system: PAYER_SYSTEM, value: MARIA_PAYER.tradingPartnerServiceId }],
      name: `${MARIA_PAYER.name} (Stedi test mode)`,
    }),
    entry(localRef('coverage'), {
      resourceType: 'Coverage', status: 'active', beneficiary: { reference: P },
      identifier: [{ system: COVERAGE_SYSTEM, value: MARIA_PAYER.memberId }],
      subscriberId: MARIA_PAYER.memberId,
      payor: [{ reference: localRef('payer-org') }],
    }),
    // Encounters across specialties (the fragmentation)
    entry(encRef('gp'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Primary Care' }, period: { start: '2022-09-14' } }),
    entry(encRef('gi'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Gastroenterology' }, period: { start: '2023-04-03' } }),
    entry(encRef('rad1'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Radiology' }, period: { start: '2024-01-20' } }),
    entry(encRef('lab'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Laboratory' }, period: { start: '2024-02-10' } }),
    entry(encRef('rad2'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Radiology' }, period: { start: '2024-06-08' } }),
    // Symptoms documented but dismissed
    entry(localRef('obs-pain'), { resourceType: 'Observation', status: 'final', code: { text: 'Chronic pelvic pain (documented, dismissed as dysmenorrhea)' }, subject: { reference: P }, encounter: { reference: encRef('gp') }, effectiveDateTime: '2022-09-14', valueString: 'Severe cyclical pelvic pain; NSAIDs prescribed.' }),
    entry(localRef('obs-gi'), { resourceType: 'Observation', status: 'final', code: { text: 'Cyclical GI symptoms (assessed as IBS)' }, subject: { reference: P }, encounter: { reference: encRef('gi') }, effectiveDateTime: '2023-04-03', valueString: 'Painful bowel movements and bloating that worsen with menses.' }),
    // The ORPHANED lab — elevated, never followed up
    entry(localRef('obs-ca125'), {
      resourceType: 'Observation', status: 'final', subject: { reference: P }, encounter: { reference: encRef('lab') },
      code: { coding: [{ system: 'http://loinc.org', code: '10334-1', display: 'CA-125' }], text: 'CA-125' },
      effectiveDateTime: '2024-02-10', valueQuantity: { value: 48, unit: 'U/mL' },
      interpretation: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'H', display: 'High' }] }],
      note: [{ text: 'No follow-up documented.' }],
    }),
    // The under-read ultrasound + MRI
    entry(localRef('dr-us'), { resourceType: 'DiagnosticReport', status: 'final', code: { text: 'Transvaginal ultrasound' }, subject: { reference: P }, encounter: { reference: encRef('rad1') }, effectiveDateTime: '2024-01-20', conclusion: 'No significant abnormality.' }),
    entry(localRef('study-mri'), { resourceType: 'ImagingStudy', status: 'available', subject: { reference: P }, started: '2024-06-08', description: 'Pelvic MRI (routine, non-endometriosis protocol)', numberOfSeries: 1, numberOfInstances: 1, modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR' }] }),
    entry(localRef('dr-mri'), { resourceType: 'DiagnosticReport', status: 'final', code: { text: 'Pelvic MRI' }, subject: { reference: P }, encounter: { reference: encRef('rad2') }, effectiveDateTime: '2024-06-08', imagingStudy: [{ reference: localRef('study-mri') }], conclusion: 'No significant abnormality. (Non-endometriosis protocol.)' }),
    // Provenance: where the MRI read came from (the "every claim links to source" story)
    entry(localRef('prov-mri'), { resourceType: 'Provenance', target: [{ reference: localRef('dr-mri') }], recorded: '2024-06-08T00:00:00Z', agent: [{ who: { display: 'Outside radiology (routine read)' } }] }),
  ],
};

async function main() {
  if (!id || !secret) {
    console.error('Set MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET in .env.local first.');
    process.exit(1);
  }
  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(id, secret);

  // Only the Patient entry is a conditional create; the history entries are plain POSTs, so a
  // second run would give Maria two of every Encounter. Rehearsing the demo should not quietly
  // corrupt the chart the demo is about — re-seed on purpose, with --force, or not at all.
  const existing = await findDemoPatient(medplum, 'maria');
  if (existing && !process.argv.includes('--force')) {
    console.log(`Already seeded — Maria is Patient/${existing.id}.`);
    console.log('Nothing written. Re-seed a duplicate history with: pnpm seed --force');
    return;
  }

  const result = await medplum.executeBatch(bundle);
  const ok = (result.entry ?? []).filter((e) => e.response?.status?.startsWith('20')).length;
  console.log(`✅ Seeded ${ok}/${bundle.entry!.length} resources into Medplum (${baseUrl}).`);
  console.log('Open https://app.medplum.com/Patient to see Maria Doe.');
}

main().catch((e) => { console.error(e); process.exit(1); });
