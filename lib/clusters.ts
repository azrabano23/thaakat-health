// The cluster engine — the "generalizable, not hardcoded" proof for judges.
// A cluster = a set of documented findings that TOGETHER suggest a condition nobody assembled.
// We ship THREE definitions (endometriosis + Sjögren's + celiac). Matching is transparent:
// collect the tags present in the assembled record, count how many a cluster needs.
// Decision-support only: a cluster surfaces documented findings + a QUESTION for a clinician.

export type Finding = {
  id: string;
  label: string; // short chip label
  detail: string; // the documented text
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

// ── The pre-seeded longitudinal record for the demo patient ("Maria") ──
// Framed as connected via the federal patient-access APIs. An endometriosis case whose clues
// are scattered across five specialists over three years — plus an orphaned lab and an
// under-read MRI (the imaging moat re-reads it live during the demo).
export const SEEDED_RECORD: Finding[] = [
  {
    id: 'gp-2022',
    label: 'Chronic pelvic pain',
    detail: 'Severe pelvic pain, prescribed NSAIDs. Noted as "likely primary dysmenorrhea."',
    specialty: 'Primary Care',
    date: '2022-09',
    source: 'Office visit note',
    tags: ['pelvic-pain', 'dysmenorrhea', 'dismissed'],
  },
  {
    id: 'gi-2023',
    label: 'Cyclical GI symptoms → "IBS"',
    detail: 'Painful bowel movements and bloating that worsen with menses. Assessed as IBS.',
    specialty: 'Gastroenterology',
    date: '2023-04',
    source: 'GI consult note',
    tags: ['gi-cyclical', 'dismissed'],
  },
  {
    id: 'us-2024',
    label: 'Pelvic ultrasound — "unremarkable"',
    detail: 'Transvaginal ultrasound read as no significant abnormality.',
    specialty: 'Radiology',
    date: '2024-01',
    source: 'Ultrasound report',
    tags: ['imaging-underread'],
  },
  {
    id: 'ca125-2024',
    label: 'CA-125 elevated — no follow-up',
    detail: 'CA-125 48 U/mL (ref <35). No follow-up documented.',
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
    specialty: 'Radiology',
    date: '2024-06',
    source: 'MRI report',
    tags: ['imaging-underread'],
  },
];

// ── The three cluster definitions ──
export const CLUSTERS: Cluster[] = [
  {
    id: 'endometriosis',
    name: 'Endometriosis pattern',
    requiredTags: ['pelvic-pain', 'dysmenorrhea', 'gi-cyclical', 'dyspareunia', 'ca125-elevated', 'die-imaging'],
    minMatch: 3,
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
    ask: 'Worth discussing an SSA/SSB (anti-Ro/La) antibody panel.',
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
export function matchClusters(record: Finding[]): ClusterMatch[] {
  const present = new Set(record.flatMap((f) => f.tags));
  return CLUSTERS.map((cluster) => {
    const matched = cluster.requiredTags.filter((t) => present.has(t));
    return { cluster, matched, confidence: matched.length / cluster.requiredTags.length };
  })
    .filter((m) => m.matched.length >= m.cluster.minMatch)
    .sort((a, b) => b.confidence - a.confidence);
}
