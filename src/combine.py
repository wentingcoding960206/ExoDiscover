import joblib
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin

class CombinedModel(BaseEstimator, ClassifierMixin):
    def __init__(self, model1, model2, features1, features2):
        self.model1 = model1
        self.model2 = model2
        self.features1 = features1
        self.features2 = features2
        self.classes_ = None  # This will be set during fitting or first prediction
        
    def fit(self, X, y):
        # This is a pre-trained model wrapper, so we don't actually fit
        # But we can set the classes based on the models
        n_classes = min(len(self.model1.classes_), len(self.model2.classes_))
        self.classes_ = np.arange(n_classes)
        return self
        
    def predict_proba(self, X):
        # Extract model-specific features
        X1 = X[self.features1]
        X2 = X[self.features2]
        
        # Predict probabilities from each model
        proba1 = self.model1.predict_proba(X1)
        proba2 = self.model2.predict_proba(X2)
        
        # Align probabilities to have same number of classes
        n_classes1 = proba1.shape[1]
        n_classes2 = proba2.shape[1]
        min_classes = min(n_classes1, n_classes2)
        
        aligned_proba1 = proba1[:, :min_classes]
        aligned_proba2 = proba2[:, :min_classes]
        
        # Renormalize to ensure probabilities sum to 1
        aligned_proba1 = aligned_proba1 / aligned_proba1.sum(axis=1, keepdims=True)
        aligned_proba2 = aligned_proba2 / aligned_proba2.sum(axis=1, keepdims=True)
        
        # Average the aligned predicted probabilities
        avg_proba = (aligned_proba1 + aligned_proba2) / 2
        
        return avg_proba
    
    def predict(self, X):
        proba = self.predict_proba(X)
        return np.argmax(proba, axis=1)

def load_models(model1_path, model2_path):
    model1 = joblib.load(model1_path)
    model2 = joblib.load(model2_path)
    return model1, model2

def get_model_features(model, model_name):
    """Extract feature names from trained model"""
    if hasattr(model, 'feature_names_in_'):
        features = [str(f) for f in model.feature_names_in_]
        print(f"{model_name} features from model: {features}")
        return features
    else:
        print(f"Warning: Could not extract features from {model_name}")
        return None

def save_combined_model(combined_model, output_path):
    """Save the combined model as a pickle file"""
    joblib.dump(combined_model, output_path)
    print(f"Combined model saved to: {output_path}")

if __name__ == "__main__":
    try:
        # Load the models
        model1, model2 = load_models("models/xgb_exo_model.pkl", "models/xgb_wen_model.pkl")
        
        # Get the actual feature names from the models
        features_model1 = get_model_features(model1, "Model 1")
        features_model2 = get_model_features(model2, "Model 2")
        
        # Create combined model
        combined_model = CombinedModel(model1, model2, features_model1, features_model2)
        
        # Set classes for the combined model
        n_classes = min(len(model1.classes_), len(model2.classes_))
        combined_model.classes_ = np.arange(n_classes)
        
        # Save the combined model
        save_combined_model(combined_model, "models/combined_model.pkl")
        
        # Test the combined model
        input_sample = pd.DataFrame([{
            "orbital_period": 0.1,
            "transit_duration": 0.2,
            "transit_depth": 0.5,
            "planet_radius": 0.8,
            "eq_temperature": 0.3,
            "insolation_flux": 0.4,
            "stellar_temp": 0.9,
            "stellar_radius": 0.2,
            "stellar_gravity": 0.1
        }])
        
        # Use the combined model for prediction
        preds = combined_model.predict(input_sample)
        proba = combined_model.predict_proba(input_sample)
        
        print("\nCombined Model Test Results:")
        print("Prediction:", preds)
        print("Confidence:", np.max(proba, axis=1))
        print("Class probabilities:", proba)
        
        # Verify by loading the saved model
        print("\nVerifying saved model...")
        loaded_combined_model = joblib.load("models/combined_model.pkl")
        preds_loaded = loaded_combined_model.predict(input_sample)
        proba_loaded = loaded_combined_model.predict_proba(input_sample)
        
        print("Loaded Model Results:")
        print("Prediction:", preds_loaded)
        print("Confidence:", np.max(proba_loaded, axis=1))
        
    except Exception as e:
        print(f"Error in main: {e}")
        import traceback
        traceback.print_exc()