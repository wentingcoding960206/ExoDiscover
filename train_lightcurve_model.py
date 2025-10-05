import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import joblib

# -----------------------------
# Step 1: Load Dataset
# -----------------------------
data_path = "exodiscover-backend/nasa_data/lightkurve_KOI_dataset.csv"
data = pd.read_csv(data_path)
print(f"Dataset loaded: {data.shape[0]} rows, {data.shape[1]} columns")

# -----------------------------
# Step 2: Handle Missing Values
# -----------------------------
data = data.dropna(subset=['flux', 'time', 'koi_disposition'])
data['flux_norm'] = (data['flux'] - data['flux'].mean()) / data['flux'].std()
print(f"After cleaning: {data.shape[0]} rows")

# -----------------------------
# Step 3: Aggregate Features per Star
# -----------------------------
# Compute statistical features per KOI
features = data.groupby('kepid')['flux_norm'].agg(['mean', 'std', 'min', 'max', 'median']).reset_index()
labels = data.groupby('kepid')['koi_disposition'].first().reset_index()

X = features.drop(columns=['kepid'])
y = labels['koi_disposition']

# -----------------------------
# Step 4: Encode Labels
# -----------------------------
le = LabelEncoder()
y = le.fit_transform(y)
print(f"Classes found: {list(le.classes_)}")

# -----------------------------
# Step 5: Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# -----------------------------
# Step 6: Train XGBoost Classifier
# -----------------------------
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42
)

print("Training XGBoost model...")
model.fit(X_train, y_train)

# -----------------------------
# Step 7: Evaluate Accuracy
# -----------------------------
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"✅ Accuracy on test set: {acc*100:.2f}%")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# -----------------------------
# Step 8: Save Trained Model
# -----------------------------
joblib.dump(model, "xgb_lightcurve_model.pkl")
print("Trained model saved as xgb_lightcurve_model.pkl")
