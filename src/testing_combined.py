import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

def load_and_prepare_data(file_path, target_column, feature_columns=None):
    """
    Load and prepare data for training
    """
    print(f"Loading data from {file_path}")
    data = pd.read_csv(file_path)
    
    if feature_columns is None:
        # Use all columns except target as features
        feature_columns = [col for col in data.columns if col != target_column]
    
    X = data[feature_columns]
    y = data[target_column]
    
    print(f"Data shape: {X.shape}")
    print(f"Target distribution:\n{y.value_counts()}")
    
    return X, y, feature_columns

def train_xgboost_model(X, y, model_name, test_size=0.2, random_state=42):
    """
    Train an XGBoost classifier
    """
    print(f"\n=== Training {model_name} ===")
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    # Optional: Scale features (XGBoost usually handles this well without scaling)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"Training set: {X_train.shape}")
    print(f"Test set: {X_test.shape}")
    print(f"Classes: {np.unique(y)}")
    
    # Define XGBoost parameters
    params = {
        'objective': 'multi:softprob',
        'num_class': len(np.unique(y)),
        'max_depth': 6,
        'learning_rate': 0.1,
        'n_estimators': 100,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'random_state': random_state,
        'eval_metric': 'mlogloss'
    }
    
    # Create and train the model
    model = xgb.XGBClassifier(**params)
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)
    
    # Evaluate the model
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Print feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    return model, scaler, X_test_scaled, y_test, accuracy

def save_model_and_artifacts(model, scaler, feature_columns, model_path, scaler_path, features_path):
    """
    Save model, scaler, and feature information
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    # Save model
    joblib.dump(model, model_path)
    print(f"Model saved to: {model_path}")
    
    # Save scaler
    joblib.dump(scaler, scaler_path)
    print(f"Scaler saved to: {scaler_path}")
    
    # Save feature columns
    joblib.dump(feature_columns, features_path)
    print(f"Feature columns saved to: {features_path}")

def main():
    """
    Main training function
    """
    # Configuration
    DATA_PATH_1 = "data/dataset1.csv"  # Update with your actual data path
    DATA_PATH_2 = "data/dataset2.csv"  # Update with your actual data path
    TARGET_COLUMN = "target"  # Update with your actual target column name
    
    # Feature sets for each model (update based on your data)
    FEATURES_MODEL_1 = [
        "orbital_period", "planet_radius", "transit_depth", "transit_duration",
        "eq_temperature", "insolation_flux", "stellar_temp", "stellar_radius", "stellar_gravity"
    ]
    
    FEATURES_MODEL_2 = [
        "transit_depth", "transit_duration", "eq_temperature", 
        "insolation_flux", "planet_radius", "stellar_temp"
    ]
    
    try:
        # Train Model 1
        print("Training Model 1...")
        X1, y1, features1 = load_and_prepare_data(DATA_PATH_1, TARGET_COLUMN, FEATURES_MODEL_1)
        model1, scaler1, X_test1, y_test1, acc1 = train_xgboost_model(X1, y1, "Model 1")
        
        # Save Model 1 artifacts
        save_model_and_artifacts(
            model1, scaler1, features1,
            "models/xgb_exo_model.pkl",
            "models/scaler_exo.pkl", 
            "models/features_exo.pkl"
        )
        
        # Train Model 2
        print("\n" + "="*50)
        print("Training Model 2...")
        X2, y2, features2 = load_and_prepare_data(DATA_PATH_2, TARGET_COLUMN, FEATURES_MODEL_2)
        model2, scaler2, X_test2, y_test2, acc2 = train_xgboost_model(X2, y2, "Model 2")
        
        # Save Model 2 artifacts
        save_model_and_artifacts(
            model2, scaler2, features2,
            "models/xgb_wen_model.pkl",
            "models/scaler_wen.pkl",
            "models/features_wen.pkl"
        )
        
        print("\n" + "="*50)
        print("Training completed successfully!")
        print(f"Model 1 Accuracy: {acc1:.4f}")
        print(f"Model 2 Accuracy: {acc2:.4f}")
        
    except Exception as e:
        print(f"Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()