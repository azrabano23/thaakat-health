"""Train an honest classifier on the extracted radiomic features and export what the app serves.

  python train.py --features features.csv --labels labels.csv --out model.joblib
    labels.csv columns: id,label   (label = 1 endometriosis / positive, 0 negative)

Reports cross-validated ROC-AUC (small-n honest), fits the final model, and writes
top_features.json (the drivers we surface in the demo report). Keep n honest — with a small
real dataset this is a proof-of-pipeline, not a clinical claim.
"""
import argparse
import json

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", required=True)
    ap.add_argument("--labels", required=True)
    ap.add_argument("--out", default="model.joblib")
    args = ap.parse_args()

    X = pd.read_csv(args.features)
    y = pd.read_csv(args.labels)
    df = X.merge(y, on="id")
    feat_cols = [c for c in X.columns if c != "id"]
    Xm, ym = df[feat_cols].values, df["label"].values

    clf = make_pipeline(StandardScaler(), RandomForestClassifier(n_estimators=300, random_state=0))
    n_splits = min(5, int(pd.Series(ym).value_counts().min()))
    if n_splits >= 2:
        cv = StratifiedKFold(n_splits, shuffle=True, random_state=0)
        auc = cross_val_score(clf, Xm, ym, cv=cv, scoring="roc_auc")
        print(f"CV ROC-AUC: {auc.mean():.3f} +/- {auc.std():.3f}  (n={len(ym)}, {n_splits}-fold)")
    else:
        print(f"n={len(ym)} too small for CV — fitting only (report as proof-of-pipeline).")

    clf.fit(Xm, ym)
    joblib.dump({"model": clf, "features": feat_cols}, args.out)

    rf = clf.named_steps["randomforestclassifier"]
    top = sorted(zip(feat_cols, rf.feature_importances_), key=lambda t: -t[1])[:10]
    json.dump([{"feature": f, "importance": float(i)} for f, i in top], open("top_features.json", "w"), indent=2)
    print(f"Saved {args.out} + top_features.json (top drivers for the demo report).")


if __name__ == "__main__":
    main()
