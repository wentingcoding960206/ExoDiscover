import pandas as pd
from pathlib import Path

csv_path = Path("merged_predictions.csv")
json_path = Path("merged_predictions.json")

if csv_path.exists():
    df = pd.read_csv(csv_path)
    df.to_json(json_path, orient="records", indent=2)
    print(f"✅ Exported JSON to {json_path.resolve()}")
else:
    print(f"❌ File not found: {csv_path}")
