"""Train XGBoost classifier on merged dataset and save model + label encoder."""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from xgboost import XGBClassifier
import joblib
import json
import os

def train_xgb(merged_csv_path="data/merged_cleaned.csv", model_out_path="models/xgb_exo_model.pkl", encoder_out_path="models/label_encoder.pkl", feat_out_path="data/feature_importance.json"):
    df = pd.read_csv(merged_csv_path)


    # Drop non-feature columns
    X = df.drop(columns=["disposition", "source"], errors="ignore")
    
    # Drop non-numeric columns automatically
    X = X.select_dtypes(include=["int64", "float64", "bool"])

    y = df["disposition"].astype(str)

    # Encode labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y)


    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)


    model = XGBClassifier(
        n_estimators=400,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1
    )


    model.fit(X_train, y_train)


    # Evaluate
    y_pred = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred, target_names=le.classes_))


    # Feature importances
    importances = dict(zip(X.columns, model.feature_importances_.tolist()))
    with open(feat_out_path, "w") as f:
        json.dump(importances, f, indent=2)


    # Save model + encoder
    joblib.dump(model, model_out_path)
    joblib.dump(le, encoder_out_path)
    print("Saved model and label encoder.")




if __name__ == "__main__":
    train_xgb()

model = joblib.load("models/xgb_exo_model.pkl")
feat_importances = pd.Series(model.feature_importances_, index=pd.read_csv("data/merged_cleaned.csv").drop(columns=["disposition","source"], errors="ignore").select_dtypes(include=["number"]).columns)
print("Top 10 Important Features:")
print(feat_importances.nlargest(10))