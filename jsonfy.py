import pandas as pd

csv_path = "../predictions.csv"
json_path = "../predictions.json"

df = pd.read_csv(csv_path)
df.to_json(json_path, orient="records", indent=2)

print(f"Exported JSON to {json_path}")