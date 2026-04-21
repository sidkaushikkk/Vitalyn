import joblib
import numpy as np
import pandas as pd
import os

# Define path to the trained model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Prioritize the real model
REAL_MODEL_PATH = os.path.join(BASE_DIR, "vitals_model_real.joblib")
FALLBACK_MODEL_PATH = os.path.join(BASE_DIR, "vitals_model.pkl")

# Load model globally
model = None
is_real_model = False

if os.path.exists(REAL_MODEL_PATH):
    try:
        model = joblib.load(REAL_MODEL_PATH)
        print(f"REAL Vitals Model loaded from {REAL_MODEL_PATH}")
        is_real_model = True
    except Exception as e:
        print(f"Error loading real vitals model: {e}")

if model is None and os.path.exists(FALLBACK_MODEL_PATH):
    try:
        model = joblib.load(FALLBACK_MODEL_PATH)
        print(f"Fallback Vitals Model loaded from {FALLBACK_MODEL_PATH}")
    except Exception as e:
        print(f"Error loading fallback vitals model: {e}")

def analyze_vitals(data):
    """
    Predicts risk level based on vitals data.
    Input: dict or Pydantic model with fields:
    heart_rate, bp_systolic, bp_diastolic, spo2, temperature, pain_level, fatigue_level
    """
    if model is None:
        return {"error": "Model not loaded", "risk_score": 0}
    
    try:
        if is_real_model:
            # Real model uses 5 features (MIMIC-III trained)
            input_data = pd.DataFrame([{
                'heart_rate': data.heart_rate,
                'bp_systolic': data.bp_systolic,
                'bp_diastolic': data.bp_diastolic,
                'spo2': data.spo2,
                'temperature': data.temperature
            }])
            
            # Predict class (0=Normal, 1=Sepsis)
            risk_class = model.predict(input_data)[0]
            probs = model.predict_proba(input_data)[0]
            
            # Sepsis probability as risk score (0-100)
            risk_score = probs[1] * 100
            
            return {
                "risk_class": int(risk_class), # 1 = Sepsis Risk
                "risk_score": float(risk_score),
                "probabilities": {
                    "low": float(probs[0]),
                    "high": float(probs[1])
                },
                "model_used": "real_mimic_iii"
            }
            
        else:
            # Fallback synthetic model (7 features)
            input_data = pd.DataFrame([{
                'heart_rate': data.heart_rate,
                'bp_systolic': data.bp_systolic,
                'bp_diastolic': data.bp_diastolic,
                'spo2': data.spo2,
                'temperature': data.temperature,
                'pain_level': data.pain_level,
                'fatigue_level': data.fatigue_level
            }])
            
            # Predict class (0, 1, 2)
            risk_class = model.predict(input_data)[0]
            probs = model.predict_proba(input_data)[0]
            risk_score = (probs[1] * 50) + (probs[2] * 100)
            
            return {
                "risk_class": int(risk_class),
                "risk_score": float(risk_score),
                "probabilities": {
                    "low": float(probs[0]),
                    "medium": float(probs[1]),
                    "high": float(probs[2])
                },
                "model_used": "synthetic"
            }
            
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"error": str(e), "risk_score": 0}
