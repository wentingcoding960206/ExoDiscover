from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Load pretrained model and encoder (place these files in models/)
MODEL_PATH = "models/xgb_exo_model.pkl"
ENC_PATH = "models/label_encoder.pkl"

model = None
label_encoder = None


def load_model():
    global model, label_encoder
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENC_PATH)
    print("Model and label encoder loaded.")


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/predict_tabular", methods=["POST"])
def predict_tabular():
    if model is None:
        return jsonify({"error": "model not loaded"}), 500

    data = request.get_json()
    # Expect a single sample or a list of samples matching training features
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    else:
        df = pd.DataFrame(data)

    # Align columns: if any missing cols present, fill with 0
    model_cols = model.get_booster().feature_names if hasattr(model, 'get_booster') else df.columns
    for c in model_cols:
        if c not in df.columns:
            df[c] = 0

    preds = model.predict(df)
    probs = model.predict_proba(df)

    out = []
    for p, pr in zip(preds, probs):
        out.append({
            "prediction": label_encoder.inverse_transform([p])[0],
            "confidence": float(np.max(pr))
        })

    if len(out) == 1:
        return jsonify(out[0])
    return jsonify(out)


@app.route("/explore", methods=["GET"])
def explore():
    # Return a small slice of merged dataset for frontend exploration
    try:
        df = pd.read_csv("data/merged_cleaned.csv")
        sample = df.sample(min(50, len(df))).to_dict(orient="records")
        return jsonify(sample)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=5000, debug=True)