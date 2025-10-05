import argparse
import pandas as pd
import pickle
import numpy as np
from sklearn.metrics import accuracy_score, mean_squared_error

def main(model_path, data_path, target_column, output_path="predictions.csv"):
    # Load model
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully.")

    # Load dataset
    data = pd.read_csv(data_path)
    print("✅ Dataset loaded successfully.")

    # Ensure target column exists
    if target_column not in data.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset.")

    # Separate features and target
    X = data.drop(columns=[target_column])
    
    # Keep planet_id and planet_name for output but drop them from features
    output_cols = []
    for col in ["planet_id", "planet_name"]:
        if col in X.columns:
            output_cols.append(col)
    
    # Identify non-numeric columns to drop for XGBoost
    non_numeric = X.select_dtypes(exclude=[np.number]).columns.tolist()
    for col in output_cols:
        if col in non_numeric:
            non_numeric.remove(col)  # keep for output
    if non_numeric:
        print(f"⚠️ Dropping non-numeric columns for XGBoost: {non_numeric}")
        X = X.drop(columns=non_numeric)
    # Drop planet_id/planet_name from features if they are still in X
    X = X.drop(columns=[c for c in output_cols if c in X.columns])

    y = data[target_column]

    # Handle NaN values
    X = X.fillna(0)
    y = y.fillna(0)

    # Predict
    y_pred = model.predict(X)

    # Detect if classification or regression
    is_classification = len(np.unique(y)) <= 20 and np.all(np.mod(y, 1) == 0)
    if is_classification:
        y = y.astype(int)
        y_pred = np.round(y_pred).astype(int)
        acc = accuracy_score(y, y_pred)
        print(f"🎯 Accuracy: {acc * 100:.2f}%")
    else:
        mse = mean_squared_error(y, y_pred)
        print(f"📉 Mean Squared Error: {mse:.4f}")

    # --- Save predictions with planet_id and planet_name ---
    output_df = pd.DataFrame()
    for col in output_cols:
        output_df[col] = data[col] if col in data.columns else np.arange(len(data))
    
    output_df["true"] = y
    output_df["pred"] = y_pred

    output_df.to_csv(output_path, index=False)
    print(f"💾 Predictions saved to '{output_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test a trained XGBoost model with a dataset.")
    parser.add_argument("--model", type=str, required=True, help="Path to the .pkl model file.")
    parser.add_argument("--data", type=str, required=True, help="Path to the dataset CSV file.")
    parser.add_argument("--target", type=str, required=True, help="Target column name in dataset.")
    parser.add_argument("--output", type=str, default="predictions.csv", help="Output CSV path for predictions.")
    args = parser.parse_args()

    main(args.model, args.data, args.target, args.output)
