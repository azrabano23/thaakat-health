// The cluster engine — the "generalizable, not hardcoded" proof for judges.
// A cluster = a set of documented findings that TOGETHER suggest a condition nobody assembled.
// We ship THREE definitions (endometriosis + Sjögren's + celiac) and TWO seeded patients, so the
// same engine can be shown firing a different cluster live rather than just pointed at in config.
// Matching is transparent: collect the tags present in the assembled record, count how many a
// cluster needs. Decision-support only: a cluster surfaces documented findings + a QUESTION for a
// clinician. Synthetic data only.

export type Finding = {
  id: string;
  label: string; // short chip label
  detail: string; // the documented text
  // Short spoken clause Thaakat uses when it cites this record item out loud. The chart-aware
  // question is assembled from the mentions of whatever retrieval actually returned — which is
  // what keeps "I can see a CA-125 nobody followed up" from being a hardcoded string.
  // Optional: findings created live (voice tools, radiomics) fall back to the label.
  mention?: string;
  specialty: string; // where it came from
  date: string; // YYYY-MM
  source: string; // source document (for Provenance)
  tags: string[]; // used for cluster matching
  orphaned?: boolean; // documented but never followed up
  fromImaging?: boolean; // surfaced by the radiomics re-read (added live in the demo)
};

export type Cluster = {
  id: string;
  name: string;
  requiredTags: string[];
  minMatch: number;
  narration: string; // what lights up on screen
  ask: string; // the question for the clinician (NEVER a diagnosis to the patient)
  confirmatory: { name: string; cptCode?: string; serviceTypeCodes?: string[] };
};

export type ClusterMatch = { cluster: Cluster; matched: string[]; confidence: number };

// A seeded demo patient: a longitudinal record scattered across specialists, plus the scripted
// turn where she supplies the piece the chart never captured.
export type DemoPatient = {
  id: string;
  name: { given: string; family: string };
  headline: string; // one line under the selector
  payer: 'aetna' | 'uhc'; // which Stedi test-mode identity to price against
  record: Finding[];
  retrievalQuery: string; // what Thaakat asks Moss over her whole record
  question: string; // the follow-up Thaakat appends after citing what retrieval returned
  reply: string; // her spoken answer
  reported: Finding; // what that answer adds to the timeline
  // present only when this patient has an under-read scan to re-read (the imaging moat)
  imaging?: {
    studyId: string;
    intro: string; // what Thaakat says before re-reading
    label: string;
    specialty: string;
    date: string;
    source: string;
    tags: string[];
  };
};

// ── Patient 1: "Maria" — the endometriosis case (the main demo run) ──
// Clues scattered across five specialists over three years, plus an orphaned lab and an
// under-read MRI (the radiomics layer re-reads it live during the demo).
const MARIA: DemoPatient = {
  id: 'maria',
  name: { given: 'Maria', family: 'Doe' },
  headline: 'Endometriosis pattern · 5 clinicians, 3 years',
  // UHC test-mode returns authOrCertIndicator "Y", which is what drives the prior-auth beat
  // (Claim(use="preauthorization") + Task). Aetna test-mode returns "U"/undetermined — with that
  // identity the demo silently skips PA entirely.
  payer: 'uhc',
  retrievalQuery: 'cyclical pelvic pain elevated CA-125 never followed up unremarkable pelvic ultrasound',
  question: 'When is the pain at its worst — and does it ever hurt during sex?',
  reply: "It's worst right before my period. And yeah… it really hurts during sex. Five doctors told me it was normal.",
  record: [
    {
      id: 'gp-2022',
      label: 'Chronic pelvic pain',
      detail: 'Severe pelvic pain, prescribed NSAIDs. Noted as "likely primary dysmenorrhea."',
      mention: 'a primary-care note from 2022 about severe pelvic pain put down to period cramps',
      specialty: 'Primary Care',
      date: '2022-09',
      source: 'Office visit note',
      tags: ['pelvic-pain', 'dysmenorrhea', 'dismissed'],
    },
    {
      id: 'gi-2023',
      label: 'Cyclical GI symptoms → "IBS"',
      detail: 'Painful bowel movements and bloating that worsen with menses. Assessed as IBS.',
      mention: 'a GI consult where painful bowel movements that track with your cycle were assessed as IBS',
      specialty: 'Gastroenterology',
      date: '2023-04',
      source: 'GI consult note',
      tags: ['gi-cyclical', 'dismissed'],
    },
    {
      id: 'us-2024',
      label: 'Pelvic ultrasound — "unremarkable"',
      detail: 'Transvaginal ultrasound read as no significant abnormality.',
      mention: 'a pelvic ultrasound from 2024 read as unremarkable',
      specialty: 'Radiology',
      date: '2024-01',
      source: 'Ultrasound report',
      tags: ['imaging-underread'],
    },
    {
      id: 'ca125-2024',
      label: 'CA-125 elevated — no follow-up',
      detail: 'CA-125 48 U/mL (ref <35). No follow-up documented.',
      mention: 'a CA-125 from 2024 that came back high and was never followed up',
      specialty: 'Laboratory',
      date: '2024-02',
      source: 'Lab result',
      tags: ['ca125-elevated'],
      orphaned: true,
    },
    {
      id: 'mri-2024',
      label: 'Pelvic MRI — read as normal',
      detail: 'Pelvic MRI reported as "no significant abnormality." (routine, non-endo protocol)',
      mention: 'a pelvic MRI from 2024 reported as normal on a routine protocol',
      specialty: 'Radiology',
      date: '2024-06',
      source: 'MRI report',
      tags: ['imaging-underread'],
    },
  ],
  reported: {
    id: 'pt-today',
    label: 'Pain during sex + cyclical (today)',
    detail:
      'Patient-reported: deep dyspareunia, pain worst premenstrually, misses work. Dismissed by prior clinicians.',
    mention: 'deep pain during sex, worst premenstrually',
    specialty: 'Patient (today)',
    date: '2025-08',
    source: 'Thaakat voice intake',
    tags: ['dyspareunia', 'pelvic-pain', 'severity'],
  },
  imaging: {
    studyId: 'demo-pelvic-mri-1',
    intro: 'You mentioned an MRI they called normal. Let me look at it myself.',
    label: 'MRI re-read: signs consistent with deep infiltrating endometriosis',
    specialty: 'Thaakat radiomics',
    date: '2024-06',
    source: 'Radiomics re-read of 2024 pelvic MRI',
    tags: ['die-imaging'],
  },
};

// ── Patient 2: "Dana" — the Sjögren's case (the "does this only work for endo?" answer) ──
// Same engine, same UI, zero endo-specific code: a different cluster fires because a different
// set of tags is present. No under-read scan here — this one is pure record assembly, which is
// the honest version of the story.
const DANA: DemoPatient = {
  id: 'dana',
  name: { given: 'Dana', family: 'Ruiz' },
  headline: "Sjögren's pattern · 4 clinicians, 4 years",
  payer: 'aetna',
  retrievalQuery: 'dry eyes dry mouth dental caries fatigue positive ANA never followed up',
  question: 'How much water are you getting through in a day — and can you still cry?',
  reply:
    "I drink almost four liters. And no — when my father died last year I couldn't produce tears. Everyone treated a different piece of it.",
  record: [
    {
      id: 'oph-2021',
      label: 'Severe dry eye',
      detail: 'Chronic dry eye, artificial tears then punctal plugs. No systemic workup documented.',
      mention: 'an ophthalmology note from 2021 about severe dry eye treated with punctal plugs',
      specialty: 'Ophthalmology',
      date: '2021-03',
      source: 'Ophthalmology visit note',
      tags: ['dry-eyes', 'dismissed'],
    },
    {
      id: 'dent-2022',
      label: 'Rampant caries + dry mouth',
      detail: 'Unusual pattern of cervical caries with reported xerostomia. Counselled on sugar intake.',
      mention: 'a dental note from 2022 describing an unusual pattern of cavities alongside a dry mouth',
      specialty: 'Dentistry',
      date: '2022-11',
      source: 'Dental chart',
      tags: ['dry-mouth'],
    },
    {
      id: 'gp-2023',
      label: 'Fatigue — "labs unremarkable"',
      detail: 'Persistent fatigue and joint aches. CBC/TSH normal. Sleep hygiene advised.',
      mention: 'a primary-care note from 2023 about persistent fatigue where the basic labs came back normal',
      specialty: 'Primary Care',
      date: '2023-06',
      source: 'Office visit note',
      tags: ['fatigue', 'dismissed'],
    },
    {
      id: 'ana-2024',
      label: 'ANA positive 1:320 — no follow-up',
      detail: 'ANA positive, speckled pattern, 1:320. No rheumatology referral or follow-up documented.',
      mention: 'a positive ANA at 1:320 from 2024 that nobody followed up',
      specialty: 'Laboratory',
      date: '2024-09',
      source: 'Lab result',
      tags: ['ana-positive'],
      orphaned: true,
    },
  ],
  reported: {
    id: 'pt-today-dana',
    label: 'Dryness severity + no tears (today)',
    detail: 'Patient-reported: ~4L fluid/day for xerostomia, absent tear production under emotional stimulus.',
    mention: 'drinking about four liters a day and being unable to produce tears',
    specialty: 'Patient (today)',
    date: '2025-08',
    source: 'Thaakat voice intake',
    tags: ['dry-mouth', 'dry-eyes', 'severity'],
  },
};

export const DEMO_PATIENTS: DemoPatient[] = [MARIA, DANA];

export function getPatient(id: string): DemoPatient {
  return DEMO_PATIENTS.find((p) => p.id === id) ?? MARIA;
}

// Back-compat: the scripted demo path seeds the main demo patient's record directly.
// Prefer getPatient(id).record for anything that should follow the patient switcher.
export const SEEDED_RECORD: Finding[] = MARIA.record;

// What Thaakat cites out loud for a finding retrieval surfaced.
export function mentionOf(f: Finding): string {
  return f.mention ?? f.label.toLowerCase();
}

// ── The three cluster definitions ──
export const CLUSTERS: Cluster[] = [
  {
    id: 'endometriosis',
    name: 'Endometriosis pattern',
    requiredTags: ['pelvic-pain', 'dysmenorrhea', 'gi-cyclical', 'dyspareunia', 'ca125-elevated', 'die-imaging'],
    minMatch: 4,
    narration:
      'Cyclical pelvic pain, cyclical GI symptoms, an unfollowed CA-125, and imaging signs of deep infiltrating endometriosis — a pattern spread across five clinicians over three years that nobody assembled.',
    ask: 'Worth discussing an endometriosis-protocol pelvic MRI and a referral to a gyn/endometriosis specialist (with diagnostic laparoscopy on the table).',
    confirmatory: { name: 'Endometriosis-protocol pelvic MRI', cptCode: '72197', serviceTypeCodes: ['30'] },
  },
  {
    id: 'sjogrens',
    name: "Sjögren's pattern",
    requiredTags: ['dry-eyes', 'dry-mouth', 'fatigue', 'ana-positive'],
    minMatch: 3,
    narration:
      "Dry eyes, dry mouth, fatigue, and a positive ANA documented across ophthalmology, dentistry, and primary care — the textbook Sjögren's cluster that gets treated as three unrelated problems.",
    ask: 'Worth discussing an SSA/SSB (anti-Ro/La) antibody panel and a rheumatology referral.',
    confirmatory: { name: 'SSA/SSB (anti-Ro/La) antibody panel', cptCode: '86235', serviceTypeCodes: ['30'] },
  },
  {
    id: 'celiac',
    name: 'Celiac pattern',
    requiredTags: ['gi-chronic', 'iron-deficiency', 'fatigue', 'ttg-positive'],
    minMatch: 3,
    narration:
      'Chronic GI symptoms, iron-deficiency anemia, and fatigue documented separately — a celiac pattern that commonly goes years without the connecting test.',
    ask: 'Worth discussing a tissue transglutaminase (tTG-IgA) panel while still on a gluten-containing diet.',
    confirmatory: { name: 'tTG-IgA celiac panel', cptCode: '83516', serviceTypeCodes: ['30'] },
  },
];

// Transparent matcher: how many of a cluster's required tags are present in the assembled record?
// minMatch is a floor, not first-match-wins — every cluster is evaluated against every record,
// which is what keeps the other two quiet when one patient's pattern fires.
export function matchClusters(record: Finding[]): ClusterMatch[] {
  const present = new Set(record.flatMap((f) => f.tags));
  return CLUSTERS.map((cluster) => {
    const matched = cluster.requiredTags.filter((t) => present.has(t));
    return { cluster, matched, confidence: matched.length / cluster.requiredTags.length };
  })
    .filter((m) => m.matched.length >= m.cluster.minMatch)
    .sort((a, b) => b.confidence - a.confidence);
}
