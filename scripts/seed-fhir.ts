// Seed a REAL Medplum project with Maria's synthetic longitudinal record (a transaction Bundle).
// Run: fill .env.local (MEDPLUM_CLIENT_ID/SECRET), then `pnpm seed`.
// Demonstrates FHIR breadth judges care about: Patient, Coverage, Encounter (5 specialties),
// Observation (incl. the orphaned CA-125), DiagnosticReport + ImagingStudy (the under-read MRI),
// and Provenance. Synthetic data only.
import { MedplumClient, createReference } from '@medplum/core';
import type { Bundle } from '@medplum/fhirtypes';
import { loadEnv } from './env';

// Reads .env then .env.local, ignoring empty values — see scripts/env.ts for why that matters.
loadEnv();

const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
const id = process.env.MEDPLUM_CLIENT_ID;
const secret = process.env.MEDPLUM_CLIENT_SECRET;

const P = 'urn:uuid:patient';
const encRef = (n: string) => `urn:uuid:enc-${n}`;

function entry(fullUrl: string, resource: any) {
  return { fullUrl, resource, request: { method: 'POST' as const, url: resource.resourceType } };
}

const bundle: Bundle = {
  resourceType: 'Bundle',
  type: 'transaction',
  entry: [
    entry(P, { resourceType: 'Patient', name: [{ given: ['Maria'], family: 'Doe' }], gender: 'female', birthDate: '1994-05-02' }),
    entry('urn:uuid:coverage', {
      resourceType: 'Coverage', status: 'active', beneficiary: { reference: P },
      subscriberId: 'AETNA12345', payor: [{ display: 'Aetna (test)' }],
    }),
    // Encounters across specialties (the fragmentation)
    entry(encRef('gp'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Primary Care' }, period: { start: '2022-09-14' } }),
    entry(encRef('gi'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Gastroenterology' }, period: { start: '2023-04-03' } }),
    entry(encRef('rad1'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Radiology' }, period: { start: '2024-01-20' } }),
    entry(encRef('lab'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Laboratory' }, period: { start: '2024-02-10' } }),
    entry(encRef('rad2'), { resourceType: 'Encounter', status: 'finished', class: { code: 'AMB' }, subject: { reference: P }, serviceType: { text: 'Radiology' }, period: { start: '2024-06-08' } }),
    // Symptoms documented but dismissed
    entry('urn:uuid:obs-pain', { resourceType: 'Observation', status: 'final', code: { text: 'Chronic pelvic pain (documented, dismissed as dysmenorrhea)' }, subject: { reference: P }, encounter: { reference: encRef('gp') }, effectiveDateTime: '2022-09-14', valueString: 'Severe cyclical pelvic pain; NSAIDs prescribed.' }),
    entry('urn:uuid:obs-gi', { resourceType: 'Observation', status: 'final', code: { text: 'Cyclical GI symptoms (assessed as IBS)' }, subject: { reference: P }, encounter: { reference: encRef('gi') }, effectiveDateTime: '2023-04-03', valueString: 'Painful bowel movements and bloating that worsen with menses.' }),
    // The ORPHANED lab — elevated, never followed up
    entry('urn:uuid:obs-ca125', {
      resourceType: 'Observation', status: 'final', subject: { reference: P }, encounter: { reference: encRef('lab') },
      code: { coding: [{ system: 'http://loinc.org', code: '10334-1', display: 'CA-125' }], text: 'CA-125' },
      effectiveDateTime: '2024-02-10', valueQuantity: { value: 48, unit: 'U/mL' },
      interpretation: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'H', display: 'High' }] }],
      note: [{ text: 'No follow-up documented.' }],
    }),
    // The under-read ultrasound + MRI
    entry('urn:uuid:dr-us', { resourceType: 'DiagnosticReport', status: 'final', code: { text: 'Transvaginal ultrasound' }, subject: { reference: P }, encounter: { reference: encRef('rad1') }, effectiveDateTime: '2024-01-20', conclusion: 'No significant abnormality.' }),
    entry('urn:uuid:study-mri', { resourceType: 'ImagingStudy', status: 'available', subject: { reference: P }, started: '2024-06-08', description: 'Pelvic MRI (routine, non-endometriosis protocol)', numberOfSeries: 1, numberOfInstances: 1, modality: [{ system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'MR' }] }),
    entry('urn:uuid:dr-mri', { resourceType: 'DiagnosticReport', status: 'final', code: { text: 'Pelvic MRI' }, subject: { reference: P }, encounter: { reference: encRef('rad2') }, effectiveDateTime: '2024-06-08', imagingStudy: [{ reference: 'urn:uuid:study-mri' }], conclusion: 'No significant abnormality. (Non-endometriosis protocol.)' }),
    // Provenance: where the MRI read came from (the "every claim links to source" story)
    entry('urn:uuid:prov-mri', { resourceType: 'Provenance', target: [{ reference: 'urn:uuid:dr-mri' }], recorded: '2024-06-08T00:00:00Z', agent: [{ who: { display: 'Outside radiology (routine read)' } }] }),
  ],
};

async function main() {
  if (!id || !secret) {
    console.error('Set MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET in .env.local first.');
    process.exit(1);
  }
  const medplum = new MedplumClient({ baseUrl, fetch });
  await medplum.startClientLogin(id, secret);
  const result = await medplum.executeBatch(bundle);
  const ok = (result.entry ?? []).filter((e) => e.response?.status?.startsWith('20')).length;
  console.log(`✅ Seeded ${ok}/${bundle.entry!.length} resources into Medplum (${baseUrl}).`);
  console.log('Open https://app.medplum.com/Patient to see Maria Doe.');
}

main().catch((e) => { console.error(e); process.exit(1); });
