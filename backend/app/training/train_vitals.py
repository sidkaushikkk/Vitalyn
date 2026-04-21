import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

# Define file path for the model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "../models")
MODEL_PATH = os.path.join(MODEL_DIR, "vitals_model.pkl")
os.makedirs(MODEL_DIR, exist_ok=True)

def generate_synthetic_data(n_samples=5000):
    """
    Generates synthetic patient vitals data based on medical thresholds.
    Features: Heart Rate, Systolic BP, Diastolic BP, SpO2, Temperature, Pain, Fatigue
    Target: Risk Level (0: Low, 1: Medium, 2: High)
    """
    np.random.seed(42)
    
    # 1. Generate "Healthy" / Low Risk Data (60%)
    n_healthy = int(n_samples * 0.6)
    healthy_data = {
        'heart_rate': np.random.normal(75, 10, n_healthy),      # Normal: 60-100
        'bp_systolic': np.random.normal(120, 10, n_healthy),    # Normal: 110-130
        'bp_diastolic': np.random.normal(80, 8, n_healthy),     # Normal: 70-85
        'spo2': np.random.normal(98, 1, n_healthy),             # Normal: 95-100
        'temperature': np.random.normal(37.0, 0.4, n_healthy),  # Normal: 36.5-37.5
        'pain_level': np.random.randint(0, 4, n_healthy),       # Low pain
        'fatigue_level': np.random.randint(0, 4, n_healthy),    # Low fatigue
        'risk_level': np.zeros(n_healthy)
    }

    # 2. Generate "Warning" / Medium Risk Data (25%)
    # Scenarios: Mild fever, hypertension, slight tachycardia
    n_warning = int(n_samples * 0.25)
    warning_data = {
        'heart_rate': np.random.normal(105, 10, n_warning),     # Elevated
        'bp_systolic': np.random.normal(145, 10, n_warning),    # High
        'bp_diastolic': np.random.normal(95, 8, n_warning),     # High
        'spo2': np.random.normal(93, 2, n_warning),             # Borderline
        'temperature': np.random.normal(38.0, 0.5, n_warning),  # Feverish
        'pain_level': np.random.randint(4, 7, n_warning),       # Moderate pain
        'fatigue_level': np.random.randint(4, 8, n_warning),    # Moderate fatigue
        'risk_level': np.ones(n_warning)
    }

    # 3. Generate "Critical" / High Risk Data (15%)
    # Scenarios: Sepsis (High HR, Fever/Hypothermia), Hypoxia (Low SpO2), Hypertensive Crisis
    n_critical = int(n_samples * 0.15)
    critical_data = {
        'heart_rate': np.random.normal(130, 15, n_critical),    # Tachycardia
        'bp_systolic': np.concatenate([
            np.random.normal(180, 15, n_critical // 2),         # Crisis
            np.random.normal(80, 10, n_critical // 2 + 1)       # Shock/Hypotension
        ])[:n_critical],
        'bp_diastolic': np.random.normal(110, 15, n_critical),
        'spo2': np.random.normal(85, 5, n_critical),            # Hypoxia
        'temperature': np.concatenate([
            np.random.normal(39.5, 0.5, n_critical // 2),       # High Fever
            np.random.normal(35.0, 0.5, n_critical // 2 + 1)    # Hypothermia
        ])[:n_critical],
        'pain_level': np.random.randint(7, 11, n_critical),     # Severe pain
        'fatigue_level': np.random.randint(8, 11, n_critical),  # Exhaustion
        'risk_level': np.full(n_critical, 2)
    }

    # Combine
    df_healthy = pd.DataFrame(healthy_data)
    df_warning = pd.DataFrame(warning_data)
    df_critical = pd.DataFrame(critical_data)
    
    df = pd.concat([df_healthy, df_warning, df_critical], ignore_index=True)
    
    # Add some noise/outliers to make it robust
    return df.sample(frac=1, random_state=42).reset_index(drop=True)

def train_model():
    print("generating synthetic clinical data...")
    df = generate_synthetic_data(10000)
    
    X = df.drop('risk_level', axis=1)
    y = df['risk_level']
    
    print(f"Dataset shape: {df.shape}")
    print(f"Class distribution:\n{y.value_counts(normalize=True)}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    accuracy = clf.score(X_test, y_test)
    print(f"Model Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, clf.predict(X_test)))
    
    # Save the model
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
