import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.impute import SimpleImputer

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "../../../public/mimic-iii-clinical-database-demo-1.4")
MODEL_PATH = os.path.join(BASE_DIR, "../models/vitals_model_real.joblib")

# MIMIC-III Item IDs (Metavision)
ITEM_IDS = {
    "HeartRate": [220045, 211],
    "SystolicBP": [220179, 51, 455],
    "DiastolicBP": [220180, 8368, 8441],
    "SpO2": [220277, 646],
    "TempF": [223761, 678],
    "TempC": [223762, 676]
}

# Sepsis ICD-9 Codes
SEPSIS_CODES = ["99591", "99592", "78552"]

def load_data():
    print("Loading MIMIC-III data...")
    
    # 1. Load Diagnoses to identify Sepsis patients
    diag_path = os.path.join(PUBLIC_DIR, "DIAGNOSES_ICD.csv")
    if not os.path.exists(diag_path):
        raise FileNotFoundError(f"DIAGNOSES_ICD.csv not found at {diag_path}")
        
    diag_df = pd.read_csv(diag_path)
    
    # Identify Sepsis Subjects
    sepsis_subjects = diag_df[diag_df['icd9_code'].isin(SEPSIS_CODES)]['subject_id'].unique()
    print(f"Found {len(sepsis_subjects)} sepsis patients.")
    
    # 2. Load Chart Events (Vitals)
    chart_path = os.path.join(PUBLIC_DIR, "CHARTEVENTS.csv")
    if not os.path.exists(chart_path):
        raise FileNotFoundError(f"CHARTEVENTS.csv not found at {chart_path}")
        
    # Read only necessary columns to save memory
    chart_df = pd.read_csv(chart_path, usecols=['subject_id', 'itemid', 'valuenum'])
    
    # Filter for relevant Item IDs
    all_ids = [id for ids in ITEM_IDS.values() for id in ids]
    chart_df = chart_df[chart_df['itemid'].isin(all_ids)]
    
    # 3. Pivot/Aggregate Data
    print("Processing vitals...")
    
    # Map Item IDs to Feature Names
    id_to_feature = {}
    for feature, ids in ITEM_IDS.items():
        for id in ids:
            id_to_feature[id] = feature
            
    chart_df['feature'] = chart_df['itemid'].map(id_to_feature)
    
    # Handle Temperature Conversion (C to F)
    # We want everything in F or C. Let's standardize to C.
    # TempF to C: (F - 32) * 5/9
    mask_f = chart_df['feature'] == 'TempF'
    chart_df.loc[mask_f, 'valuenum'] = (chart_df.loc[mask_f, 'valuenum'] - 32) * 5/9
    chart_df.loc[mask_f, 'feature'] = 'TempC' # Now it's C
    
    # Group by Subject and Feature, taking mean
    # In a real scenario, we'd use time-series windows. Here we aggregate per patient.
    pivot_df = chart_df.groupby(['subject_id', 'feature'])['valuenum'].mean().unstack()
    
    # Rename columns to match our internal model
    # Internal model expects: heart_rate, bp_systolic, bp_diastolic, spo2, temperature
    column_map = {
        "HeartRate": "heart_rate",
        "SystolicBP": "bp_systolic",
        "DiastolicBP": "bp_diastolic",
        "SpO2": "spo2",
        "TempC": "temperature"
    }
    pivot_df = pivot_df.rename(columns=column_map)
    
    # Add Target Variable
    pivot_df['is_sepsis'] = pivot_df.index.isin(sepsis_subjects).astype(int)
    
    # Fill missing values with normal defaults (simple imputation)
    defaults = {
        "heart_rate": 75,
        "bp_systolic": 120,
        "bp_diastolic": 80,
        "spo2": 98,
        "temperature": 37.0
    }
    pivot_df = pivot_df.fillna(defaults)
    
    return pivot_df

def train_model():
    df = load_data()
    
    features = ["heart_rate", "bp_systolic", "bp_diastolic", "spo2", "temperature"]
    X = df[features]
    y = df['is_sepsis']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train
    print("Training Random Forest...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    print("Model Evaluation:")
    print(classification_report(y_test, y_pred))
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    
    # Save
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    try:
        train_model()
    except Exception as e:
        print(f"Error: {e}")
