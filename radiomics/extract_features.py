"""Real radiomics feature extraction with PyRadiomics (the standard tool used in published
endo/gyn imaging papers). Run on REAL downloaded images + segmentation masks -> features.csv.

Works with any SimpleITK-readable format (NIfTI .nii.gz, NRRD, DICOM series, PNG for 2D US).
Assumes an image and a matching mask with the same filename in --images / --masks.

  pip install -r requirements.txt
  python extract_features.py --images data/images --masks data/masks --out features.csv
"""
import argparse
import csv
import os

from radiomics import featureextractor  # pyradiomics


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", required=True, help="dir of images")
    ap.add_argument("--masks", required=True, help="dir of segmentation masks (matching filenames)")
    ap.add_argument("--out", default="features.csv")
    ap.add_argument("--params", default=None, help="optional PyRadiomics params .yaml")
    ap.add_argument("--label", type=int, default=1, help="mask label to extract (default 1)")
    args = ap.parse_args()

    extractor = (
        featureextractor.RadiomicsFeatureExtractor(args.params)
        if args.params
        else featureextractor.RadiomicsFeatureExtractor()
    )
    # first-order + shape + GLCM/GLRLM/GLSZM texture (the endometriosis-relevant signal)
    extractor.enableAllFeatures()

    rows = []
    for fn in sorted(os.listdir(args.images)):
        img = os.path.join(args.images, fn)
        mask = os.path.join(args.masks, fn)
        if not os.path.exists(mask):
            print(f"skip {fn}: no matching mask")
            continue
        try:
            result = extractor.execute(img, mask, label=args.label)
        except Exception as e:  # noqa: BLE001
            print(f"skip {fn}: {e}")
            continue
        feats = {k: float(v) for k, v in result.items() if not k.startswith("diagnostics")}
        feats["id"] = fn
        rows.append(feats)
        print(f"ok {fn}: {len(feats)-1} features")

    if not rows:
        raise SystemExit("No features extracted — check image/mask paths and formats.")

    keys = sorted({k for r in rows for k in r if k != "id"})
    with open(args.out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id"] + keys)
        w.writeheader()
        w.writerows(rows)
    print(f"\nWrote {len(rows)} cases x {len(keys)} radiomic features -> {args.out}")


if __name__ == "__main__":
    main()
