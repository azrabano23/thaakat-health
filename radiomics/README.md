# Radiomics pipeline (real, not simulated)

This is the **real** feature pipeline behind Thaakat's imaging moat — PyRadiomics (the standard
library used in published endo/gyn imaging research), run on **real public imaging data**.

## Pipeline
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 1) real features from real images + masks (dataset in ../docs/DATASETS.md)
python extract_features.py --images data/images --masks data/masks --out features.csv

# 2) train + report honest cross-validated AUC, export drivers
python train.py --features features.csv --labels labels.csv --out model.joblib
```

## How it feeds the app
The web app (Vercel/JS) can't run PyRadiomics (Python). Two honest options:
1. **Precompute** real features on the demo cases offline → write the results (findings + top
   drivers from `top_features.json`) into `lib/imaging.ts`, replacing the stub. Real data, real
   features, reliable on stage.
2. Stand up a tiny Python service (FastAPI) exposing `/analyze` and point
   `app/api/imaging/analyze` at it for live extraction.

## Honesty rules (say this to judges)
- With a small real dataset this is **proof-of-pipeline**, not a clinical claim. Report the real
  n and CV-AUC; don't inflate.
- Frame outputs as **decision-support / detection**, never "diagnosis."
- Datasets, licenses, and access are in [`../docs/DATASETS.md`](../docs/DATASETS.md) (filled in from
  the dataset hunt). Respect each dataset's data-use agreement.
