"""Real radiomic feature extraction + training on REAL images, with a robust install.
Uses scikit-image GLCM texture + first-order features (the same texture family PyRadiomics
computes) so it runs without PyRadiomics' fragile C build. Trains a classifier over class
subfolders of images (e.g., GLENDA endometriosis pathology classes).

  python real_pipeline.py --data <dir-of-class-subfolders> --out real_endo

Outputs: <out>_features.csv, <out>_summary.json (n, classes, CV score, top features).
"""
import argparse, os, json, csv
import numpy as np
from PIL import Image
from skimage.feature import graycomatrix, graycoprops
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score

LEVELS = 32


def find_images(root):
    exts = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")
    out = []
    for dp, _, files in os.walk(root):
        for f in files:
            if f.lower().endswith(exts):
                out.append(os.path.join(dp, f))
    return out


def features(path):
    img = Image.open(path).convert("L").resize((256, 256))
    a = np.asarray(img, dtype=np.float64)
    # first-order
    mean, std = float(a.mean()), float(a.std())
    hist = np.histogram(a, bins=32, range=(0, 255), density=True)[0] + 1e-12
    ent = float(-(hist * np.log2(hist)).sum())
    energy1 = float((hist ** 2).sum())
    p10, p90 = float(np.percentile(a, 10)), float(np.percentile(a, 90))
    # GLCM texture (average over 0 and 90 degrees, distance 1)
    q = (a / 256 * LEVELS).astype(np.uint8)
    glcm = graycomatrix(q, distances=[1], angles=[0, np.pi / 2], levels=LEVELS, symmetric=True, normed=True)
    tex = {p: float(graycoprops(glcm, p).mean()) for p in
           ("contrast", "dissimilarity", "homogeneity", "energy", "correlation", "ASM")}
    return {"fo_mean": mean, "fo_std": std, "fo_entropy": ent, "fo_energy": energy1,
            "fo_p10": p10, "fo_p90": p90, **{f"glcm_{k}": v for k, v in tex.items()}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default="real")
    ap.add_argument("--per-class", type=int, default=250)
    args = ap.parse_args()

    imgs = find_images(args.data)
    # label = immediate parent folder name
    by_class = {}
    for p in imgs:
        by_class.setdefault(os.path.basename(os.path.dirname(p)), []).append(p)
    classes = {c: v[: args.per_class] for c, v in by_class.items() if len(v) >= 5}
    print(f"found {len(imgs)} images across {len(by_class)} folders; using classes: "
          + ", ".join(f"{c}({len(v)})" for c, v in classes.items()))
    if len(classes) < 2:
        print("Need >=2 classes with >=5 images to train. Extracting features only.")

    rows, X, y, names = [], [], [], sorted(classes)
    for ci, c in enumerate(names):
        for p in classes[c]:
            try:
                f = features(p)
            except Exception as e:
                continue
            rows.append({"id": os.path.relpath(p, args.data), "label": c, **f})
            X.append([f[k] for k in sorted(f)])
            y.append(ci)
    if not rows:
        raise SystemExit("No features extracted.")

    fkeys = sorted(features(classes[names[0]][0]))
    with open(f"{args.out}_features.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["id", "label"] + fkeys)
        w.writeheader(); w.writerows(rows)

    summary = {"n": len(rows), "classes": {c: len(classes[c]) for c in names}, "features": fkeys}
    X, y = np.array(X), np.array(y)
    if len(names) >= 2 and min(np.bincount(y)) >= 3:
        clf = RandomForestClassifier(n_estimators=300, random_state=0)
        k = min(5, int(min(np.bincount(y))))
        cv = StratifiedKFold(k, shuffle=True, random_state=0)
        acc = cross_val_score(clf, X, y, cv=cv, scoring="accuracy")
        summary["cv_accuracy"] = f"{acc.mean():.3f} +/- {acc.std():.3f}"
        summary["cv_folds"] = k
        clf.fit(X, y)
        imp = sorted(zip(fkeys, clf.feature_importances_), key=lambda t: -t[1])[:8]
        summary["top_features"] = [{"feature": f, "importance": round(float(i), 4)} for f, i in imp]
        print(f"REAL model trained on {len(rows)} real images — CV accuracy {summary['cv_accuracy']} ({len(names)} classes)")
        for f, i in imp[:6]:
            print(f"   {f}: {i:.4f}")
    json.dump(summary, open(f"{args.out}_summary.json", "w"), indent=2)
    print(f"wrote {args.out}_features.csv + {args.out}_summary.json")


if __name__ == "__main__":
    main()
