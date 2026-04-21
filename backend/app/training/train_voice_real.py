import os
import glob
import librosa
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Configuration
# Path to the 'public' folder where Actor_XX folders are located
# Adjusted for the script running from project root or backend folder
DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../public"))
MODEL_OUTPUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/voice_model.pkl"))

# RAVDESS Emotion Codes
# 01 = neutral, 02 = calm, 03 = happy, 04 = sad, 05 = angry, 06 = fearful, 07 = disgust, 08 = surprised
# Mapping to Stress Levels:
# Low Risk: Neutral (01), Calm (02), Happy (03)
# Medium Risk: Sad (04), Surprised (08)
# High Risk: Angry (05), Fearful (06), Disgust (07)

EMOTION_MAP = {
    '01': 0, # Low
    '02': 0, # Low
    '03': 0, # Low
    '04': 1, # Medium
    '05': 2, # High
    '06': 2, # High
    '07': 2, # High
    '08': 1  # Medium
}

def extract_features(file_path):
    """
    Extracts MFCC features from an audio file.
    Returns a 1D array of mean MFCCs.
    """
    try:
        y, sr = librosa.load(file_path, duration=3, offset=0.5)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        mfcc_mean = np.mean(mfcc.T, axis=0)
        return mfcc_mean
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

def load_data():
    print(f"Looking for data in: {DATASET_PATH}/Actor_*/*.wav")
    wav_files = glob.glob(os.path.join(DATASET_PATH, "Actor_*", "*.wav"))
    
    if not wav_files:
        print("No audio files found! Check the path.")
        return [], []
        
    print(f"Found {len(wav_files)} audio files. Extracting features...")
    
    X = []
    y = []
    
    for file_path in wav_files:
        # Extract label from filename (3rd part)
        # Filename example: 03-01-06-01-01-01-01.wav
        filename = os.path.basename(file_path)
        parts = filename.split("-")
        
        if len(parts) < 3:
            continue
            
        emotion_code = parts[2]
        if emotion_code not in EMOTION_MAP:
            continue
            
        label = EMOTION_MAP[emotion_code]
        
        # Extract features
        features = extract_features(file_path)
        
        if features is not None:
            X.append(features)
            y.append(label)
            
    return np.array(X), np.array(y)

def train_model():
    print("Starting Voice Model Training...")
    X, y = load_data()
    
    if len(X) == 0:
        print("Dataset is empty. Aborting.")
        return

    print(f"Dataset shape: {X.shape}")
    print(f"Class distribution: {np.bincount(y)}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Classifier
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'Medium Risk', 'High Risk']))

    # Save
    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_OUTPUT_PATH)
    print(f"Model saved to {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train_model()
