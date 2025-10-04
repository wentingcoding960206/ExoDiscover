import pandas as pd

df = pd.read_csv("data/simplified.csv")
print(df.head())

df = df.drop(columns=["planet_name"])

from sklearn.preprocessing import LabelEncoder

le = LabelEncoder()
df["disposition"] = le.fit_transform(df["disposition"])

from sklearn.model_selection import train_test_split

X = df.drop("disposition", axis=1)
y = df["disposition"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

from xgboost import XGBClassifier

model = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss')
model.fit(X_train, y_train)

from sklearn.metrics import classification_report, accuracy_score

y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
target_names = [str(label) for label in le.classes_]
print(classification_report(y_test, y_pred, target_names=target_names))

import joblib

joblib.dump(model, "models/xgb_wen_model.pkl")
joblib.dump(le, "models/label_encoder.pkl")
