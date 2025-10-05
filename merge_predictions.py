import pandas as pd
import numpy as np

# Load both datasets
# Replace with your actual file paths
df1 = pd.read_csv("./predictions_test_set.csv")  # First dataset with probabilities
df2 = pd.read_csv("./predictions.csv")  # Second dataset (more accurate, frontend friendly)

# If needed, rename columns in df1 for alignment
df1 = df1.rename(columns={
    "Actual": "true",
    "Predicted": "pred",
    "KOI_index": "planet_id",
    "Prob_CANDIDATE": "prob_candidate",
    "Prob_CONFIRMED": "prob_confirmed",
    "Prob_FALSE POSITIVE": "prob_false_positive"
})

# Fill missing values in df2 for planet_name
df2["planet_name"] = df2["planet_name"].fillna("Unknown")

# Convert text labels to numeric: CONFIRMED → 2, CANDIDATE → 1, FALSE POSITIVE → 0
label_map = {"FALSE POSITIVE": 0, "CANDIDATE": 1, "CONFIRMED": 2}
if df1["true"].dtype == object:
    df1["true"] = df1["true"].map(label_map)
    df1["pred"] = df1["pred"].map(label_map)

# Merge: keep all rows from df2 (higher priority), and optionally enrich with df1 data
# Match on planet_id or index
if "planet_id" in df1.columns and "planet_id" in df2.columns:
    merged = pd.merge(df2, df1[["planet_id", "prob_candidate", "prob_confirmed", "prob_false_positive"]],
                      on="planet_id", how="left")
else:
    df2["index"] = np.arange(len(df2))
    df1["index"] = np.arange(len(df1))
    merged = pd.merge(df2, df1[["index", "prob_candidate", "prob_confirmed", "prob_false_positive"]],
                      on="index", how="left")
    merged = merged.drop(columns=["index"])

# Prioritize model2’s prediction
merged["final_prediction"] = merged["pred"]

# Optional: Rename for clarity
merged = merged.rename(columns={
    "true": "actual_label",
    "pred": "model2_prediction"
})

# Save result
merged.to_csv("merged_predictions.csv", index=False)
print("✅ Combined predictions saved to data/merged_predictions.csv")
