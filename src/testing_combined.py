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
    y = data[target_column]

    # Keep a copy of full original data for export
    full_data = data.copy()

    # Keep planet_id and planet_name for output if available
    output_cols = []
    for col in ["planet_id", "planet_name"]:
        if col in X.columns:
            output_cols.append(col)

    # Drop non-numeric columns (except planet_id/planet_name)
    non_numeric = X.select_dtypes(exclude=[np.number]).columns.tolist()
    for col in output_cols:
        if col in non_numeric:
            non_numeric.remove(col)  # keep for output
    if non_numeric:
        print(f"⚠️ Dropping non-numeric columns for model input: {non_numeric}")
        X = X.drop(columns=non_numeric)
    # Drop planet_id/planet_name from X if still in
    X = X.drop(columns=[col for col in output_cols if col in X.columns])

    # Fill missing values
    X = X.fillna(0)
    y = y.fillna(0)

    # Predict
    y_pred = model.predict(X)

    # Determine classification vs regression
    is_classification = len(np.unique(y)) <= 20 and np.all(np.mod(y, 1) == 0)
    if is_classification:
        y = y.astype(int)
        y_pred = np.round(y_pred).astype(int)
        acc = accuracy_score(y, y_pred)
        print(f"🎯 Accuracy: {acc * 100:.2f}%")
    else:
        mse = mean_squared_error(y, y_pred)
        print(f"📉 Mean Squared Error: {mse:.4f}")

    # Add predictions to original full dataset
    full_data["true"] = y
    full_data["pred"] = y_pred

    # Export full data with predictions
    full_data.to_csv(output_path, index=False)
    print(f"💾 Predictions saved to '{output_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test a trained XGBoost or sklearn model with a dataset.")
    parser.add_argument("--model", type=str, required=True, help="Path to the .pkl model file.")
    parser.add_argument("--data", type=str, required=True, help="Path to the dataset CSV file.")
    parser.add_argument("--target", type=str, required=True, help="Target column name in dataset.")
    parser.add_argument("--output", type=str, default="predictions.csv", help="Output CSV path for predictions.")
    args = parser.parse_args()

    main(args.model, args.data, args.target, args.output)
