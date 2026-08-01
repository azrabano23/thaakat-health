"""Emit a REAL ROC + PR curve from the trained model, for the site's model card.
Loads the already-extracted real GLENDA features, runs the same 5-fold StratifiedKFold
RandomForest, collects OUT-OF-FOLD predicted probabilities (no leakage), and writes
downsampled ROC/PR points + per-fold AUCs to lib/radiomics-model.json.

  python roc_curve.py
"""
import json, csv
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_curve, auc, precision_recall_curve, average_precision_score

CSV = "real_endo_features.csv"
OUT = "../lib/radiomics-model.json"

# GLENDA folder→label mapping (matches real_endo_summary.json: 500 pathology / 5490 no-pathology).
# The annotated endometriosis frames live under the "frames"/"annots" folders (250 each = 500);
# every "v_<video>_s_<range>" segment folder is a no-pathology frame set (5490 total).
POS_LABELS = {"frames", "annots", "pathology", "endo", "endometriosis"}

def load():
    X, y, feats = [], [], None
    with open(CSV) as fh:
        r = csv.DictReader(fh)
        cols = [c for c in r.fieldnames if c not in ("id", "label")]
        feats = cols
        for row in r:
            X.append([float(row[c]) for c in cols])
            y.append(1 if row["label"].strip().lower() in POS_LABELS else 0)
    return np.array(X), np.array(y), feats

def main():
    X, y, feats = load()
    n_pos, n_neg = int(y.sum()), int((1 - y).sum())
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    oof = np.zeros(len(y))
    fold_aucs = []
    for tr, te in cv.split(X, y):
        clf = RandomForestClassifier(n_estimators=300, random_state=0, class_weight="balanced")
        clf.fit(X[tr], y[tr])
        p = clf.predict_proba(X[te])[:, 1]
        oof[te] = p
        fpr, tpr, _ = roc_curve(y[te], p)
        fold_aucs.append(float(auc(fpr, tpr)))

    # pooled out-of-fold ROC + PR (honest, no leakage)
    fpr, tpr, _ = roc_curve(y, oof)
    roc_auc = float(auc(fpr, tpr))
    prec, rec, _ = precision_recall_curve(y, oof)
    ap = float(average_precision_score(y, oof))

    def downsample(xs, ys, k=48):
        idx = np.linspace(0, len(xs) - 1, min(k, len(xs))).astype(int)
        return [[round(float(xs[i]), 4), round(float(ys[i]), 4)] for i in idx]

    out = {
        "task": "Endometriosis vs. no-pathology (real GLENDA laparoscopy frames)",
        "dataset": "GLENDA v1.5",
        "n": len(y),
        "n_pos": n_pos,
        "n_neg": n_neg,
        "prevalence": round(n_pos / len(y), 4),
        "cv_folds": 5,
        "roc_auc": round(roc_auc, 4),
        "fold_aucs": [round(a, 4) for a in fold_aucs],
        "fold_auc_mean": round(float(np.mean(fold_aucs)), 4),
        "fold_auc_std": round(float(np.std(fold_aucs)), 4),
        "average_precision": round(ap, 4),
        "roc": downsample(fpr, tpr),
        "pr": downsample(rec, prec),
        "features": feats,
        "model": "RandomForest (300 trees, class-weight balanced), scikit-image GLCM + first-order texture",
        "note": "Out-of-fold predictions, 5-fold stratified CV. Reported as AUC (not accuracy) because the set is imbalanced (%d positive / %d total)." % (n_pos, len(y)),
    }
    json.dump(out, open(OUT, "w"), indent=2)
    print("ROC AUC (pooled OOF): %.4f | per-fold: %s | AP: %.4f" % (roc_auc, out["fold_aucs"], ap))
    print("wrote", OUT)

if __name__ == "__main__":
    main()
