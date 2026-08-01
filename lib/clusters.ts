// The cluster engine — the "generalizable, not hardcoded" proof for judges.
// A cluster = a set of documented findings that TOGETHER suggest a condition nobody assembled.
// We ship THREE definitions (endometriosis + Sjögren's + celiac) and FOUR seeded patients, so the
// same engine can be shown firing a different cluster live rather than just pointed at in config.
// Matching is transparent: collect the tags present in the assembled record, count how many a
// cluster needs. Decision-support only: a cluster surfaces documented findings + a QUESTION for a
// clinician. Synthetic data only.
//
// The four patients each prove a different thing about the engine:
//   maria — endometriosis, the main run (the only one with an under-read scan to re-read)
//   dana  — Sjögren's, pure record assembly: "does this only work for endo?"
//   priya — celiac, so all three shipped definitions actually fire rather than two of three
//   grace — NEGATIVE CONTROL: a real scattered record where nothing meets threshold.
//           Without her, every patient we show lights up and "it always finds something" is
//           unanswerable. She is a negative control against the patterns we ship — not a
//           specificity claim, and it should not be described as one.

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
  // Who the generated ServiceRequest is addressed to. Lives on the cluster, not the patient:
  // the referral follows the pattern that fired, not the person. Previously hardcoded to
  // "Gyn / endometriosis specialist" at both call sites, which sent Dana's ServiceRequest to a
  // gynecologist for a Sjögren's workup.
  referralSpecialty: string;
  confirmatory: { name: string; cptCode?: string; serviceTypeCodes?: string[] };
};

// `missing` is requiredTags minus matched — needed to render WHY a cluster fell short, which is
// the whole point of the negative-control patient.
export type ClusterMatch = { cluster: Cluster; matched: string[]; missing: string[]; confidence: number };

// Charted clinical data for the patient banner (the EHR-style header a clinician reads first).
// flag drives the color: 'high'/'low' = out of range, the thing a rushed eye skims past.
export type Vital = { label: string; value: string; unit?: string; flag?: 'high' | 'low' | 'normal' };
export type Lab = {
  label: string;
  value: string;
  ref: string; // reference range, shown small
  flag?: 'high' | 'low' | 'normal';
  orphaned?: boolean; // out of range and never acted on — the signal already on file
};

// A seeded demo patient: a longitudinal record scattered across specialists, plus the scripted
// turn where she supplies the piece the chart never captured.
export type DemoPatient = {
  id: string;
  name: { given: string; family: string };
  headline: string; // one line under the selector
  payer: 'aetna' | 'uhc'; // which Stedi test-mode identity to price against
  demographics: { age: number; sex: string; mrn: string }; // synthetic — banner header
  chart: {
    chiefComplaint: string; // the starting point / presenting problem
    symptoms: string[]; // presenting symptoms in the patient's words
    pmh: string[]; // past medical history
    psh: string[]; // past surgical history
    meds: string[]; // current medications
    allergies: string[]; // drug allergies (NKDA if none)
    family: string[]; // relevant family history
    social?: string; // one-line social history
    pathology?: string; // biopsy / tissue diagnosis status (the confirmatory gate)
  };
  vitals: Vital[]; // most-recent charted vitals
  labs: Lab[]; // key labs across the record, with the orphaned out-of-range ones flagged
  record: Finding[];
  retrievalQuery: string; // what Thaakat asks Moss over her whole record
  question: string; // the follow-up Thaakat appends after citing what retrieval returned
  reply: string; // her spoken answer
  reported: Finding; // what that answer adds to the timeline
  // What Thaakat says once the record is assembled — including when NOTHING fires, which is why
  // this is required rather than optional. It replaced a `patient.id === 'maria' ? ... : ...`
  // ternary in app/intake/page.tsx that told every non-Maria patient to see a rheumatologist.
  assembledLine: string;
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
  demographics: { age: 31, sex: 'Female', mrn: 'MRN 22-910-43' },
  chart: {
    chiefComplaint: 'Cyclical pelvic pain for 3 years, deep pain with intercourse, now 14 months trying to conceive without success.',
    symptoms: [
      'Pelvic pain worst 1–2 days before menses',
      'Deep dyspareunia',
      'Painful bowel movements during period',
      'Heavy menstrual bleeding with clots',
      'Cyclical fatigue, missing work',
    ],
    pmh: ['Dysmenorrhea since menarche (age 12)', 'Provisional IBS (2023)', 'Iron-deficiency anemia', 'Migraine with aura'],
    psh: ['Appendectomy (age 19)', 'No diagnostic laparoscopy performed'],
    meds: ['Ibuprofen 600 mg PRN', 'Combined OCP — trialed, discontinued (breakthrough pain)', 'Ferrous sulfate 325 mg daily'],
    allergies: ['Penicillin (rash)'],
    family: ['Mother — endometriosis, diagnosed at hysterectomy', 'Sister — infertility'],
    social: 'Non-smoker; occasional alcohol; product designer; nulligravid (G0P0)',
    pathology: 'No laparoscopy performed — no histologic diagnosis on file. Surgery remains the diagnostic gate she has waited 3 years for.',
  },
  vitals: [
    { label: 'BP', value: '118/76', unit: 'mmHg', flag: 'normal' },
    { label: 'HR', value: '84', unit: 'bpm', flag: 'normal' },
    { label: 'Temp', value: '98.4', unit: '°F', flag: 'normal' },
    { label: 'BMI', value: '22.6', flag: 'normal' },
    { label: 'Pain', value: '8/10', unit: 'cyclical peak', flag: 'high' },
  ],
  labs: [
    { label: 'CA-125', value: '48 U/mL', ref: '< 35 U/mL', flag: 'high', orphaned: true },
    { label: 'Hemoglobin', value: '11.1 g/dL', ref: '12.0–15.5', flag: 'low' },
    { label: 'Ferritin', value: '11 ng/mL', ref: '15–150', flag: 'low' },
    { label: 'CRP', value: '6.1 mg/L', ref: '< 5.0', flag: 'high' },
    { label: 'β-hCG', value: 'Negative', ref: 'Negative', flag: 'normal' },
  ],
  retrievalQuery: 'cyclical pelvic pain elevated CA-125 never followed up unremarkable pelvic ultrasound',
  question: 'When is the pain at its worst — and does it ever hurt during sex?',
  reply: "It's worst right before my period. And yeah… it really hurts during sex. Five doctors told me it was normal.",
  assembledLine:
    'When I put your history together — the timing of the pain, the bowel symptoms, the lab that wasn’t followed up, and this scan — I see a pattern that is worth bringing to a specialist.',
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
  demographics: { age: 44, sex: 'Female', mrn: 'MRN 31-447-08' },
  chart: {
    chiefComplaint: 'Years of dry eyes, dry mouth, fatigue and joint aches — each treated by a different specialist as a separate problem.',
    symptoms: [
      'Severe dry, gritty eyes',
      'Dry mouth, trouble swallowing dry food',
      'Unable to produce tears under emotional stimulus',
      'Persistent fatigue and joint aches',
      'Drinking ~4 L water/day',
    ],
    pmh: ['Severe dry eye (2021)', 'Rampant cervical dental caries', 'Persistent fatigue', 'Raynaud-like episodes'],
    psh: ['Bilateral punctal plugs (2021)', 'Multiple dental restorations', 'No minor salivary-gland biopsy'],
    meds: ['Artificial tears (frequent)', 'Pilocarpine — trialed', 'Ciclosporin ophthalmic emulsion'],
    allergies: ['Sulfonamides (rash)'],
    family: ['Mother — rheumatoid arthritis', 'Aunt — systemic lupus'],
    social: 'Non-smoker; high-school teacher',
    pathology: 'Minor salivary-gland (labial) biopsy never performed — the confirmatory test no single specialist ordered.',
  },
  vitals: [
    { label: 'BP', value: '122/78', unit: 'mmHg', flag: 'normal' },
    { label: 'HR', value: '74', unit: 'bpm', flag: 'normal' },
    { label: 'Temp', value: '98.6', unit: '°F', flag: 'normal' },
    { label: 'BMI', value: '23.4', flag: 'normal' },
  ],
  labs: [
    { label: 'ANA', value: 'Positive 1:320, speckled', ref: '< 1:40', flag: 'high', orphaned: true },
    { label: 'ESR', value: '32 mm/hr', ref: '< 20', flag: 'high' },
    { label: 'Schirmer test', value: '4 mm / 5 min', ref: '> 10 mm', flag: 'low' },
    { label: 'CBC', value: 'Within normal limits', ref: 'WNL', flag: 'normal' },
  ],
  retrievalQuery: 'dry eyes dry mouth dental caries fatigue positive ANA never followed up',
  question: 'How much water are you getting through in a day — and can you still cry?',
  reply:
    "I drink almost four liters. And no — when my father died last year I couldn't produce tears. Everyone treated a different piece of it.",
  assembledLine:
    'When I put these notes together, I see a pattern worth taking to a rheumatologist rather than treating each symptom separately.',
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

// ── Patient 3: "Priya" — the celiac case (so all three shipped definitions actually fire) ──
// Same shape as Dana: no under-read scan, pure record assembly. The recurring signal across all
// three positive patients is the ORPHANED LAB — Maria's CA-125, Dana's ANA, Priya's tTG-IgA.
const PRIYA: DemoPatient = {
  id: 'priya',
  name: { given: 'Priya', family: 'Nair' },
  headline: 'Celiac pattern · 3 clinicians, 3 years',
  payer: 'aetna',
  demographics: { age: 29, sex: 'Female', mrn: 'MRN 47-215-66' },
  chart: {
    chiefComplaint:
      'Three years of bloating and loose stools called IBS, iron that will not stay up, and fatigue — each managed separately.',
    symptoms: [
      'Bloating and loose stools most days',
      'Cramping 1–2 hours after eating',
      'Fatigue despite full nights of sleep',
      'Mouth ulcers that keep recurring',
      'Weight drifting down without trying',
    ],
    pmh: ['Provisional IBS (2022)', 'Iron-deficiency anemia — recurrent', 'Recurrent aphthous ulcers'],
    psh: ['None'],
    meds: ['Ferrous sulfate 325 mg daily — third course', 'Peppermint oil capsules', 'Loperamide PRN'],
    allergies: ['NKDA'],
    family: ['Maternal aunt — celiac disease', 'Mother — hypothyroidism'],
    social: 'Non-smoker; rarely drinks; software QA engineer',
    pathology:
      'No duodenal biopsy performed — the endoscopic confirmation that follows a positive serology was never arranged.',
  },
  vitals: [
    { label: 'BP', value: '108/68', unit: 'mmHg', flag: 'normal' },
    { label: 'HR', value: '88', unit: 'bpm', flag: 'normal' },
    { label: 'Temp', value: '98.2', unit: '°F', flag: 'normal' },
    { label: 'BMI', value: '19.1', flag: 'low' },
  ],
  labs: [
    { label: 'tTG-IgA', value: '84 U/mL', ref: '< 15 U/mL', flag: 'high', orphaned: true },
    { label: 'Hemoglobin', value: '10.4 g/dL', ref: '12.0–15.5', flag: 'low' },
    { label: 'Ferritin', value: '7 ng/mL', ref: '15–150', flag: 'low' },
    { label: 'Vitamin D, 25-OH', value: '17 ng/mL', ref: '30–100', flag: 'low' },
    { label: 'TSH', value: '2.1 mIU/L', ref: '0.4–4.0', flag: 'normal' },
  ],
  retrievalQuery: 'chronic bloating loose stools IBS iron deficiency fatigue positive tTG never followed up',
  question: 'Do the symptoms track with anything you eat — and has anyone repeated that coeliac blood test?',
  reply:
    "Bread and pasta days are the worst, but nobody ever connected it. And no — I didn't even know I'd had a coeliac test.",
  record: [
    {
      id: 'gi-2022-priya',
      label: 'Chronic bloating + loose stools → "IBS"',
      detail: 'Bloating, cramping and loose stools most days for over a year. Assessed as IBS; advised low-FODMAP trial.',
      mention: 'a GI note from 2022 where daily bloating and loose stools were put down to IBS',
      specialty: 'Gastroenterology',
      date: '2022-05',
      source: 'GI consult note',
      tags: ['gi-chronic', 'dismissed'],
    },
    {
      id: 'heme-2023-priya',
      label: 'Iron-deficiency anemia — supplements only',
      detail: 'Hb 10.4, ferritin 7. Third course of oral iron started. No investigation of cause documented.',
      mention: 'a haematology note from 2023 where recurrent iron deficiency was treated with supplements and never investigated',
      specialty: 'Hematology',
      date: '2023-02',
      source: 'Hematology clinic note',
      tags: ['iron-deficiency', 'dismissed'],
    },
    {
      id: 'gp-2024-priya',
      label: 'Fatigue — "labs unremarkable"',
      detail: 'Persistent fatigue. TSH and CBC reviewed as unremarkable. Advised on sleep and stress.',
      mention: 'a primary-care note from 2024 about persistent fatigue where the labs were called unremarkable',
      specialty: 'Primary Care',
      date: '2024-03',
      source: 'Office visit note',
      tags: ['fatigue', 'dismissed'],
    },
    {
      id: 'ttg-2024-priya',
      label: 'tTG-IgA 84 U/mL — no follow-up',
      detail: 'Tissue transglutaminase IgA 84 U/mL (ref <15). No endoscopy, dietetics referral, or repeat documented.',
      mention: 'a coeliac blood test from 2024 that came back strongly positive and was never acted on',
      specialty: 'Laboratory',
      date: '2024-08',
      source: 'Lab result',
      tags: ['ttg-positive'],
      orphaned: true,
    },
  ],
  reported: {
    id: 'pt-today-priya',
    label: 'Symptoms track with gluten + weight loss (today)',
    detail:
      'Patient-reported: symptoms consistently worse on bread and pasta days; unintentional weight drift; recurrent mouth ulcers.',
    mention: 'symptoms that track with bread and pasta, and weight drifting down',
    specialty: 'Patient (today)',
    date: '2025-08',
    source: 'Thaakat voice intake',
    tags: ['gi-chronic', 'severity'],
  },
  assembledLine:
    'When I put these notes together — the gut symptoms, the iron that will not stay up, and a coeliac test that came back positive and was never acted on — I see a pattern worth one conversation rather than another year of managing the pieces.',
};

// ── Patient 4: "Grace" — the NEGATIVE CONTROL (nothing fires) ──
// A genuinely benign record that still LOOKS like the others at a glance: four specialists, real
// symptoms, an out-of-range lab. The difference is that her abnormal lab was acted on and her
// findings do not corroborate each other. Closest cluster is celiac at 2 of 4 — one short of its
// minMatch of 3 — which is what the no-match panel renders.
//
// She has no `imaging` and her `reported` turn adds nothing that crosses a threshold. That is the
// point: the engine has to be able to return nothing, out loud, on a record that invites a guess.
const GRACE: DemoPatient = {
  id: 'grace',
  name: { given: 'Grace', family: 'Whitfield' },
  headline: 'No pattern meets threshold · negative control',
  payer: 'uhc',
  demographics: { age: 38, sex: 'Female', mrn: 'MRN 58-330-12' },
  chart: {
    chiefComplaint:
      'Tiredness since a documented influenza infection, on a background of separately-resolved orthopedic and headache complaints.',
    symptoms: [
      'Tiredness, gradually improving since February',
      'Occasional band-like headache at end of day',
      'Heel pain — resolved with physiotherapy',
      'Heavier periods, manageable',
    ],
    pmh: ['Influenza A (Feb 2024, PCR-confirmed)', 'Tension-type headache', 'Plantar fasciitis — resolved'],
    psh: ['Wisdom teeth extraction (age 22)'],
    meds: ['Ferrous sulfate 325 mg daily — started Mar 2024', 'Paracetamol PRN'],
    allergies: ['NKDA'],
    family: ['Father — hypertension'],
    social: 'Non-smoker; rotating night shifts (ICU nurse); two children under five',
    pathology: 'No tissue diagnosis indicated — no finding on this record reaches a threshold that would call for one.',
  },
  vitals: [
    { label: 'BP', value: '114/72', unit: 'mmHg', flag: 'normal' },
    { label: 'HR', value: '70', unit: 'bpm', flag: 'normal' },
    { label: 'Temp', value: '98.5', unit: '°F', flag: 'normal' },
    { label: 'BMI', value: '24.1', flag: 'normal' },
  ],
  labs: [
    // Out of range, but NOT orphaned — iron was started and the recheck is documented. This is the
    // contrast with Maria's CA-125, Dana's ANA and Priya's tTG: somebody did their job.
    { label: 'Ferritin', value: '14 ng/mL', ref: '15–150', flag: 'low' },
    { label: 'Hemoglobin', value: '12.4 g/dL', ref: '12.0–15.5', flag: 'normal' },
    { label: 'TSH', value: '1.8 mIU/L', ref: '0.4–4.0', flag: 'normal' },
    { label: 'CRP', value: '2.2 mg/L', ref: '< 5.0', flag: 'normal' },
    { label: 'ANA', value: 'Negative', ref: '< 1:40', flag: 'normal' },
  ],
  retrievalQuery: 'fatigue after influenza low ferritin iron started resolved heel pain tension headache',
  question: 'How has the tiredness changed since you started the iron — and is anything else new?',
  reply:
    "Honestly it's better. I'm back to running. It's mostly the night shifts and two kids under five at this point.",
  record: [
    {
      id: 'ortho-2023-grace',
      label: 'Plantar fasciitis — resolved',
      detail: 'Right heel pain on first steps. Physiotherapy and orthotic. Resolved at 3-month follow-up.',
      mention: 'an orthopedic note from 2023 about heel pain that resolved with physiotherapy',
      specialty: 'Orthopedics',
      date: '2023-04',
      source: 'Orthopedic clinic note',
      tags: ['msk-resolved'],
    },
    {
      id: 'flu-2024-grace',
      label: 'Influenza A, then post-viral fatigue',
      detail: 'PCR-confirmed influenza A. Fatigue persisting several weeks after, expected to settle. Follow-up documented.',
      mention: 'a documented influenza infection in early 2024 with the fatigue that followed it',
      specialty: 'Primary Care',
      date: '2024-02',
      source: 'Office visit note',
      tags: ['fatigue', 'post-viral'],
    },
    {
      id: 'iron-2024-grace',
      label: 'Low ferritin — treated and rechecked',
      detail: 'Ferritin 14. Oral iron started, dietary advice given, recheck at 3 months showed a rising trend.',
      mention: 'a low ferritin from 2024 that was treated with iron and rechecked',
      specialty: 'Primary Care',
      date: '2024-03',
      source: 'Lab result + follow-up note',
      tags: ['iron-deficiency'],
    },
    {
      id: 'neuro-2024-grace',
      label: 'Headache workup — tension-type',
      detail: 'End-of-day band-like headache. Neurologic exam normal, imaging not indicated. Assessed as tension-type.',
      mention: 'a neurology assessment from 2024 that concluded tension-type headache with a normal exam',
      specialty: 'Neurology',
      date: '2024-09',
      source: 'Neurology consult note',
      tags: ['headache'],
    },
  ],
  reported: {
    id: 'pt-today-grace',
    label: 'Fatigue improving on iron; shift work (today)',
    detail: 'Patient-reported: fatigue improving since iron started, back to exercising. Rotating night shifts and young children.',
    mention: 'fatigue that has been improving since starting iron',
    specialty: 'Patient (today)',
    date: '2025-08',
    source: 'Thaakat voice intake',
    tags: ['fatigue'],
  },
  assembledLine:
    'I went through your whole record — every note, every lab. I don’t see a pattern that meets the bar for me to flag anything, and your low iron was already picked up and treated. That’s information too, and I’d rather tell you that than invent something.',
};

export const DEMO_PATIENTS: DemoPatient[] = [MARIA, DANA, PRIYA, GRACE];

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
    referralSpecialty: 'Gyn / endometriosis specialist',
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
    referralSpecialty: 'Rheumatology',
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
    referralSpecialty: 'Gastroenterology',
    confirmatory: { name: 'tTG-IgA celiac panel', cptCode: '83516', serviceTypeCodes: ['30'] },
  },
];

// Transparent matcher: how many of a cluster's required tags are present in the assembled record?
// EVERY cluster is scored against EVERY record — nothing is filtered here — which is what lets the
// no-match path show what was checked and missed rather than rendering a blank panel.
//
// Ranking is by NUMBER of matched findings, with confidence only as a tiebreak. Ranking by
// confidence alone penalises the broader cluster: 4-of-6 endometriosis findings (0.67) would lose
// to 3-of-4 celiac findings (0.75), so a patient matching both gets narrated the thinner pattern.
// Callers take [0] as "the pattern", so more corroborating findings has to win.
export function scoreClusters(record: Finding[]): ClusterMatch[] {
  const present = new Set(record.flatMap((f) => f.tags));
  return CLUSTERS.map((cluster) => {
    const matched = cluster.requiredTags.filter((t) => present.has(t));
    const missing = cluster.requiredTags.filter((t) => !present.has(t));
    return { cluster, matched, missing, confidence: matched.length / cluster.requiredTags.length };
  }).sort((a, b) => b.matched.length - a.matched.length || b.confidence - a.confidence);
}

// The clusters that clear their own minMatch floor. minMatch is a floor, not first-match-wins,
// which is what keeps the other two quiet when one patient's pattern fires.
export function matchClusters(record: Finding[]): ClusterMatch[] {
  return scoreClusters(record).filter((m) => m.matched.length >= m.cluster.minMatch);
}

// The highest-scoring cluster that did NOT clear its floor. Drives the negative-control panel:
// "closest was celiac at 2 of 4, needs 3" is a legible non-finding; a blank screen is not.
// Returns null only for a record with no findings at all, where every cluster ties at zero and
// there is nothing worth naming as "closest".
export function nearMissCluster(record: Finding[]): ClusterMatch | null {
  const miss = scoreClusters(record).find((m) => m.matched.length < m.cluster.minMatch);
  return miss && miss.matched.length > 0 ? miss : null;
}
