# Real imaging datasets for Thaakat's radiomics (verified)

**Medplum has ZERO real imaging** — it only serves synthetic FHIR (Synthea); even its "Coherent" DICOM is computer-generated, not real scans. Real pixels come from the archives below. Everything here was link-verified.

## ⭐ Primary: UT-EndoMRI — real endometriosis pelvic MRI, with segmentations
This is the one. Real, endometriosis-specific, instant download, radiomics-ready.
- **Download:** https://zenodo.org/records/15750762 (v2) · v1: https://zenodo.org/records/13749613 · **paper** (Nature *Scientific Data*, 2025): https://www.nature.com/articles/s41597-025-05623-3 · **code:** https://github.com/xlianguth/RAovSeg
- **Modality:** pelvic MRI (T1, T1 fat-sat, T2, T2 fat-sat). **133 patients** (51 multi-center w/ 3-rater labels + 82 single-center).
- **Labels:** real **manual segmentations** — uterus, ovaries, **endometriomas**, cysts, cul-de-sac. NIfTI (`.nii.gz`). ← exactly what PyRadiomics needs (image + mask → features).
- **Access:** instant Zenodo zip (~8 GB), no application. **License:** treat as **non-commercial research** (Zenodo text says non-commercial; badge says CC BY — check the license file in the zip; fine for the hackathon).

## Backups (instant download, real, for a visual demo)
- **GLENDA** — endometriosis laparoscopy frames w/ pixel masks (incl. deep infiltrating endometriosis). https://ftp.itec.aau.at/datasets/GLENDA/ · CC BY-NC. Great for mask-overlay visuals on real surgical images (note: optical, not cross-sectional radiomics).
- **MMOTU** — 1,469 ovarian ultrasound images + masks (incl. endometrioma-type). https://github.com/cv516Buaa/MMOTU_DS2Net (data via Google Drive link in README).
- **TCIA** gyn collections (CT/MR, CC BY, same-day account): TCGA-OV, TCGA-UCEC, CPTAC-UCEC — proxy/adjacent only.

## The tool: PyRadiomics (real, standard)
https://github.com/AIM-Harvard/pyradiomics — the de-facto radiomics library (AIM-Harvard, IBSI-aligned). Turns each `image + mask` into a real feature vector (shape + first-order + GLCM/GLRLM/GLSZM texture). Bundled brain/breast/lung examples smoke-test the pipeline; run it on UT-EndoMRI for real gyn features. No public gyn-specific pretrained model exists (MONAI/HF) — so we extract features + train a classical model ourselves (that's the honest, doable path).

## Founder-market-fit tie-in (say this to judges)
The published endometriosis-ultrasound-AI work ("Augmenting endometriosis analysis from ultrasound data with deep learning," arXiv:2302.09621) was built on data **collected at Rutgers Robert Wood Johnson University Hospital** — **Azra's institution and exact research area.** The field's endo-imaging AI is being done where she works. That's why we can build the real model, not just talk about it.

## The 6-hour plan (real, not a sim)
1. **Tonight:** download UT-EndoMRI (~8 GB) → run `radiomics/extract_features.py` (PyRadiomics) on the image+mask pairs → cache `features.csv`. (Don't do 8 GB + extraction live on stage.)
2. `radiomics/train.py` → classical classifier (logreg/RF), report **honest** cross-validated ROC-AUC + top features (report the real n; small-n = proof-of-pipeline, not a clinical claim).
3. **Serve it:** write the real precomputed findings + top drivers into `lib/imaging.ts` (replaces the stub) → the demo shows real features/overlays on real endometriosis MRI.
4. **Framing:** decision-support / detection, never "diagnosis." Cite UT-EndoMRI per its terms.
