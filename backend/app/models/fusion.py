def calculate_risk(results):
    """
    Multimodal Fusion Logic.
    Combines Vitals Risk (Clinical), Face Fatigue (Physical), and Voice Stress (Psychological).
    """
    
    # 1. Extract individual scores (default to 0 if missing)
    vitals_score = 0
    if "vitals_risk" in results and isinstance(results["vitals_risk"], dict):
         vitals_score = results["vitals_risk"].get("risk_score", 0)
    
    face_score = 0
    if "face_fatigue_index" in results and isinstance(results["face_fatigue_index"], dict):
        face_score = results["face_fatigue_index"].get("fatigue_level", 0)
        
    voice_score = 0
    if "voice_stress_score" in results and isinstance(results["voice_stress_score"], dict):
        voice_score = results["voice_stress_score"].get("stress_score", 0)

    # 2. Weighted Fusion
    # Vitals are most important (medical truth)
    # Face/Voice are supplementary indicators of distress
    
    # Weights
    W_VITALS = 0.6
    W_FACE = 0.2
    W_VOICE = 0.2
    
    final_risk = (vitals_score * W_VITALS) + (face_score * W_FACE) + (voice_score * W_VOICE)
    
    # 3. Dynamic Override
    # If any single modality is CRITICAL (>90), boost the overall risk significantly
    if vitals_score > 90 or face_score > 80 or voice_score > 80:
        final_risk = max(final_risk, 85)
        
    return round(final_risk, 1)
