import pandas as pd
import numpy as np

def create_sample_data():
    """
    Create sample dataset if you don't have real data yet
    """
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        "orbital_period": np.random.exponential(10, n_samples),
        "transit_duration": np.random.normal(5, 1, n_samples),
        "transit_depth": np.random.uniform(0, 1, n_samples),
        "planet_radius": np.random.uniform(0.5, 2, n_samples),
        "eq_temperature": np.random.normal(300, 50, n_samples),
        "insolation_flux": np.random.exponential(1000, n_samples),
        "stellar_temp": np.random.normal(5000, 500, n_samples),
        "stellar_radius": np.random.uniform(0.5, 1.5, n_samples),
        "stellar_gravity": np.random.normal(4.5, 0.5, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Create target variable (example: 4 classes)
    # This is a simplified example - replace with your actual target logic
    conditions = [
        (df['planet_radius'] < 1) & (df['eq_temperature'] < 320),
        (df['planet_radius'] < 1) & (df['eq_temperature'] >= 320),
        (df['planet_radius'] >= 1) & (df['eq_temperature'] < 320),
        (df['planet_radius'] >= 1) & (df['eq_temperature'] >= 320)
    ]
    choices = [0, 1, 2, 3]
    df['target'] = np.select(conditions, choices, default=0)
    
    return df

def prepare_your_data(csv_file_path):
    """
    Prepare your actual data for training
    """
    # Load your data
    df = pd.read_csv(csv_file_path)
    
    # Data cleaning and preprocessing
    # Example steps:
    
    # 1. Handle missing values
    df = df.fillna(df.mean())  # or use other imputation strategies
    
    # 2. Remove duplicates
    df = df.drop_duplicates()
    
    # 3. Feature engineering (if needed)
    # df['new_feature'] = df['feature1'] * df['feature2']
    
    # 4. Encode categorical variables (if any)
    # from sklearn.preprocessing import LabelEncoder
    # le = LabelEncoder()
    # df['categorical_column'] = le.fit_transform(df['categorical_column'])
    
    # 5. Remove outliers (optional)
    # from scipy import stats
    # df = df[(np.abs(stats.zscore(df.select_dtypes(include=[np.number]))) < 3).all(axis=1)]
    
    print(f"Data shape after preprocessing: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    print(f"Target distribution:\n{df['target'].value_counts()}")
    
    return df

# Usage example:
if __name__ == "__main__":
    # If you don't have real data yet, create sample data
    sample_df = create_sample_data()
    sample_df.to_csv("data/sample_dataset.csv", index=False)
    print("Sample data created and saved!")