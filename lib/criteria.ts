// Seed corpus for Moss retrieval (and the local fallback). Synthetic / educational.
// These are simplified, paraphrased clinical signals for a DEMO — NOT a clinical guideline.
// Frame everything as decision-support. Replace/expand with a vetted ACOG/ESHRE-derived set.

export type CriterionDoc = {
  id: string;
  text: string;
  // what follow-up question this signal should make Thaakat ask next
  followUp?: string;
  tags: string[];
};

export const ENDO_CRITERIA: CriterionDoc[] = [
  {
    id: 'cyclical-pelvic-pain',
    text: 'Chronic pelvic pain that is cyclical (worse just before and during menstruation) is a hallmark symptom associated with endometriosis.',
    followUp: 'Is the pain worse right before or during your period?',
    tags: ['pain', 'cyclical', 'menstruation'],
  },
  {
    id: 'dyspareunia',
    text: 'Deep pain during or after intercourse (dyspareunia) is commonly associated with pelvic/deep infiltrating endometriosis.',
    followUp: 'Do you have deep pain during or after sex?',
    tags: ['pain', 'dyspareunia', 'DIE'],
  },
  {
    id: 'dysmenorrhea-severe',
    text: 'Severe menstrual cramps that interfere with daily activities, sometimes with nausea or vomiting, are associated with endometriosis and adenomyosis.',
    followUp: 'Do your period cramps ever make you miss work/school, or cause nausea or vomiting?',
    tags: ['pain', 'dysmenorrhea', 'severity'],
  },
  {
    id: 'gi-cyclical',
    text: 'Cyclical bowel symptoms — painful bowel movements, diarrhea/constipation around menses, rectal pain — can indicate bowel-involved deep infiltrating endometriosis.',
    followUp: 'Do you notice painful bowel movements or bloating that tracks with your cycle?',
    tags: ['GI', 'cyclical', 'DIE'],
  },
  {
    id: 'urinary-cyclical',
    text: 'Cyclical urinary symptoms (painful urination, blood in urine around menses) can indicate bladder involvement.',
    followUp: 'Any pain with urination or blood in your urine around your period?',
    tags: ['urinary', 'cyclical'],
  },
  {
    id: 'infertility',
    text: 'Difficulty conceiving is present in a substantial fraction of people with endometriosis and raises pretest probability.',
    followUp: 'Have you had any difficulty getting pregnant, or are you planning to?',
    tags: ['fertility'],
  },
  {
    id: 'heavy-bleeding',
    text: 'Heavy menstrual bleeding and clots are associated with adenomyosis and can co-occur with endometriosis.',
    followUp: 'Are your periods very heavy, or do you pass large clots?',
    tags: ['bleeding', 'adenomyosis'],
  },
  {
    id: 'onset-age',
    text: 'Symptom onset in the teens/early twenties with years of normalized or dismissed pain is a common endometriosis history pattern.',
    followUp: 'How old were you when this pain first started?',
    tags: ['history', 'delay'],
  },
  {
    id: 'delay-dismissed',
    text: 'A history of multiple clinicians dismissing symptoms as "normal period pain" is a red flag for the diagnostic-delay pattern.',
    followUp: 'Have other doctors looked into this before? What did they say?',
    tags: ['history', 'delay'],
  },
  // ── imaging signals (used by the radiomics narration + report) ──
  {
    id: 'img-endometrioma',
    text: 'Endometrioma ("chocolate cyst"): an ovarian cyst with homogeneous low-level internal echoes on ultrasound / T1-hyperintense, T2 shading on MRI.',
    tags: ['imaging', 'ovary', 'endometrioma'],
  },
  {
    id: 'img-die',
    text: 'Deep infiltrating endometriosis (DIE): hypointense nodules/plaques in the uterosacral ligaments, rectovaginal septum, or bowel wall on T2-weighted MRI.',
    tags: ['imaging', 'DIE', 'MRI'],
  },
  {
    id: 'img-adenomyosis',
    text: 'Adenomyosis: thickened junctional zone (>12mm) on T2-weighted MRI, with myometrial cysts — frequently missed on routine reads.',
    tags: ['imaging', 'adenomyosis', 'junctional-zone'],
  },
  {
    id: 'img-kissing-ovaries',
    text: '"Kissing ovaries" sign (ovaries adherent in the midline) suggests severe pelvic adhesions from endometriosis.',
    tags: ['imaging', 'adhesions', 'severity'],
  },
];
