import pandas as pd

# Use relative path from the script location
csv_path = "../data/merged_cleaned.csv"
json_path = "../data/merged_cleaned.json"

# Read and convert
df = pd.read_csv(csv_path)
df.to_json(json_path, orient="records", indent=2)

print(f"✅ Exported JSON to {json_path}")
