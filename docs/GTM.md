# Thaakat — who pays, and the workflow for them (the YC answer)

The demo is patient-facing. **The business is not.** A YC partner will ask "who's the customer and why do they pay?" — here's the sharp answer.

## The core logic: sell to whoever loses money on the odyssey today
The 7–10 year diagnostic odyssey costs *someone*. Fee-for-service providers **profit** from the repeat visits/scans — so they're the wrong customer. The right customers are the ones who **eat the cost of delay**:

## Beachhead customer (who we sell to FIRST): fertility & endometriosis specialty clinics (REI groups)
Why them:
- **Endometriosis is a leading cause of infertility** — it sits directly on their P&L. A faster, better endo workup → better IVF outcomes → more successful cycles → revenue + reputation.
- They **intake the exact odyssey population** — patients who've bounced through 5+ clinicians for years. Assembling that mess is their daily pain.
- **Concentrated, reachable, funded buyer** (cash-pay + procedure revenue) — not diffuse PCPs. A few hundred clinics = a real early market.
- Acute ROI: today they redo the workup manually; Thaakat automates intake + record assembly + re-reads the prior "normal" imaging that missed endo.

## Expansion (the "how this gets big" story)
Specialty/fertility clinics → **value-based women's-health groups & Medicaid MCOs** (pelvic pain / endo is a top cost driver they're at risk for) → **self-insured employers / femtech benefits** (endo navigation as a benefit, Maven/Carrot channel) → **payers** (shorten the odyssey they ultimately fund). Same engine, wider buyer.

## The workflow FOR the customer (the clinician console — the product they actually buy)
The patient demo is the front door; the clinic buys the back half:
1. **Intake** — patient referred/self-books → Thaakat voice pre-visit captures the narrative.
2. **Assemble** — pull + assemble the patient's records across prior clinicians (patient-access APIs → FHIR).
3. **Re-read** — radiomics re-reads prior imaging → flags the missed endo/adeno signs.
4. **Dossier** — cluster engine surfaces the pattern → a **clinician-ready Dossier** (findings + source links + The Ask) + coverage check.
5. **Clinician console** *(the buyer's daily tool — build this view)* — clinician reviews, edits, and one-click orders the confirmatory MRI/lab/referral (writes FHIR), with prior-auth + scheduling handled.
6. **Outcomes / ROI dashboard** — time-to-diagnosis, endo catch-rate, IVF success lift, avoided duplicate scans. This is what renews the contract.

## Business model
SaaS + **per-assembled-workup** fee to the clinic (usage-aligned), moving to **PMPM** for risk-bearing buyers. Priced against the ROI: a caught endo case / an avoided odyssey-year / a higher-success cycle is worth far more than the fee.

## The metrics that sell (and that we instrument from day one)
- Time-to-diagnosis ↓ · endometriosis catch-rate ↑ · IVF/cycle success ↑ · duplicate imaging & ER visits ↓ · $ per resolved case ↓.

## Why this is fundable (the one-liner for the pitch)
> "We sell to fertility & endometriosis clinics who lose patients and revenue to a decade-long workup. Thaakat assembles the record, re-reads the scan they missed, and hands the clinician a decision-ready dossier — cutting the odyssey and lifting outcomes. It expands to every risk-bearing women's-health buyer. And the imaging moat is our founder's actual research."
