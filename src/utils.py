import pandas as pd


def load_sample_predictions(path="data/sample_predictions.json"):
    return pd.read_json(path)