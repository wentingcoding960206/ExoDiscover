import argparse
import pandas as pd
import pickle
import numpy as np
from sklearn.metrics import accuracy_score, mean_squared_error

def main(model_path, data_path, target_column):
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

    # Handle NaN values
    X = X.fillna(0)
    y = y.fillna(0)

    # Predict
    y_pred = model.predict(X)

    # Detect if classification or regression
    if len(np.unique(y)) <= 20 and np.all(np.mod(y, 1) == 0):  # heuristic for classification
        y = y.astype(int)
        y_pred = np.round(y_pred).astype(int)
        acc = accuracy_score(y, y_pred)
        print(f"🎯 Accuracy: {acc * 100:.2f}%")
    else:
        mse = mean_squared_error(y, y_pred)
        print(f"📉 Mean Squared Error: {mse:.4f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test a trained XGBoost model with a dataset.")
    parser.add_argument("--model", type=str, required=True, help="Path to the .pkl model file.")
    parser.add_argument("--data", type=str, required=True, help="Path to the dataset CSV file.")
    parser.add_argument("--target", type=str, required=True, help="Target column name in dataset.")
    args = parser.parse_args()

    main(args.model, args.data, args.target)
