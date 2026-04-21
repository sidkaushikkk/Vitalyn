import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
import os
import tempfile

# Define CNN Model Structure (Must match training)
class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.25)
        self.fc1 = nn.Linear(64 * 12 * 12, 128)
        self.fc2 = nn.Linear(128, 7)  # 7 Emotions
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = x.view(-1, 64 * 12 * 12)
        x = self.dropout(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class FaceAnalyzer:
    def __init__(self):
        self.face_mesh = None

        if getattr(mp, "solutions", None) is not None:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.3
            )
        
        self.LEFT_EYE = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE = [33, 160, 158, 133, 153, 144]
        self.LEFT_EYEBROW = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107]
        self.RIGHT_EYEBROW = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336]

        # Load PyTorch Model
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = SimpleCNN().to(self.device)
        
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        MODEL_PATH = os.path.join(BASE_DIR, "../models/face_model.pth")
        
        try:
            self.model.load_state_dict(torch.load(MODEL_PATH, map_location=self.device))
            self.model.eval()
            print(f"Face Model loaded from {MODEL_PATH}")
            self.model_loaded = True
        except Exception as e:
            print(f"Error loading face model: {e}")
            self.model_loaded = False

        self.emotions = {0: "Angry", 1: "Disgust", 2: "Fear", 3: "Happy", 4: "Sad", 5: "Surprise", 6: "Neutral"}

    def _calculate_ear(self, landmarks, eye_indices):
        """Calculate Eye Aspect Ratio"""
        A = np.linalg.norm(landmarks[eye_indices[1]] - landmarks[eye_indices[5]])
        B = np.linalg.norm(landmarks[eye_indices[2]] - landmarks[eye_indices[4]])
        C = np.linalg.norm(landmarks[eye_indices[0]] - landmarks[eye_indices[3]])
        return (A + B) / (2.0 * C)

    def analyze_frame(self, frame_bytes):
        """
        Analyzes a single video frame for signs of fatigue/pain.
        """
        try:
            if self.face_mesh is None:
                return {
                    "detected": False,
                    "fatigue_level": 0,
                    "emotion": "Unknown",
                    "risk_score": 0,
                }
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {"error": "Invalid image data"}

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            brightness = float(np.mean(gray_frame))
            results = self.face_mesh.process(rgb_frame)

            if not results.multi_face_landmarks:
                signal_quality = "low_light" if brightness < 40.0 else "no_face"
                return {
                    "detected": False,
                    "fatigue_level": 0,
                    "emotion": "Unknown",
                    "risk_score": 0,
                    "signal_quality": signal_quality,
                }

            landmarks = results.multi_face_landmarks[0].landmark
            h, w, _ = frame.shape
            
            points = np.array([[int(l.x * w), int(l.y * h)] for l in landmarks])
            left_ear = self._calculate_ear(points, self.LEFT_EYE)
            right_ear = self._calculate_ear(points, self.RIGHT_EYE)
            avg_ear = (left_ear + right_ear) / 2.0

            fatigue_score = 0
            eyelid_state = "open"
            if avg_ear < 0.18:
                fatigue_score = 95
                eyelid_state = "closed"
            elif avg_ear < 0.24:
                fatigue_score = 60
                eyelid_state = "partially_closed"
            else:
                fatigue_score = 10
                eyelid_state = "open"

            emotion = "Unknown"
            emotion_risk = 0
            brow_tension = 20
            
            if self.model_loaded:
                # Get bounding box
                x_min = min(points[:, 0])
                x_max = max(points[:, 0])
                y_min = min(points[:, 1])
                y_max = max(points[:, 1])
                
                # Padding
                pad = 20
                x_min = max(0, x_min - pad)
                y_min = max(0, y_min - pad)
                x_max = min(w, x_max + pad)
                y_max = min(h, y_max + pad)
                
                face_roi = cv2.cvtColor(frame[y_min:y_max, x_min:x_max], cv2.COLOR_BGR2GRAY)
                if face_roi.size > 0:
                    face_roi = cv2.resize(face_roi, (48, 48))
                    face_roi = face_roi / 255.0
                    face_tensor = torch.tensor(face_roi, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(self.device)
                    
                    with torch.no_grad():
                        outputs = self.model(face_tensor)
                        _, predicted = torch.max(outputs, 1)
                        emotion_idx = predicted.item()
                        emotion = self.emotions.get(emotion_idx, "Unknown")
                        
                        # Map Emotion to Risk
                        # High Risk: Pain (Angry?), Fear, Sad, Disgust
                        if emotion in ["Fear", "Sad", "Angry", "Disgust"]:
                            emotion_risk = 80
                        elif emotion == "Neutral":
                            emotion_risk = 10
                        elif emotion == "Happy":
                            emotion_risk = 0
                        elif emotion == "Surprise":
                            emotion_risk = 30

            left_eye_center = points[self.LEFT_EYE].mean(axis=0)
            right_eye_center = points[self.RIGHT_EYE].mean(axis=0)
            left_brow_center = points[self.LEFT_EYEBROW].mean(axis=0)
            right_brow_center = points[self.RIGHT_EYEBROW].mean(axis=0)
            dy_left = (left_eye_center[1] - left_brow_center[1]) / float(h)
            dy_right = (right_eye_center[1] - right_brow_center[1]) / float(h)
            brow_gap = max(0.0, (dy_left + dy_right) / 2.0)
            if brow_gap < 0.035:
                brow_tension = 90
            elif brow_gap < 0.05:
                brow_tension = 60
            else:
                brow_tension = 20

            final_risk = max(fatigue_score, emotion_risk, brow_tension)

            signal_quality = "good"
            face_width = x_max - x_min
            face_height = y_max - y_min
            if face_width < 0.3 * w or face_height < 0.3 * h:
                signal_quality = "too_far"
            elif brightness < 40.0:
                signal_quality = "low_light"

            return {
                "detected": True,
                "ear": float(avg_ear),
                "fatigue_level": fatigue_score,
                "emotion": emotion,
                "risk_score": final_risk,
                "signal_quality": signal_quality,
                "eyelid_state": eyelid_state,
                "brow_tension": float(brow_tension),
            }
            
        except Exception:
            return {
                "detected": False,
                "fatigue_level": 0,
                "emotion": "Unknown",
                "risk_score": 0,
                "signal_quality": "error",
            }

# Singleton instance
face_analyzer = FaceAnalyzer()

def analyze_face(image_or_video_bytes):
    result = face_analyzer.analyze_frame(image_or_video_bytes)
    if isinstance(result, dict) and (
        result.get("error") == "Invalid image data"
        or (not result.get("detected") and result.get("signal_quality") in (None, "no_face"))
    ):
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp.write(image_or_video_bytes)
                tmp_path = tmp.name

            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                return {
                    "detected": False,
                    "fatigue_level": 0,
                    "emotion": "Unknown",
                    "risk_score": 0,
                    "signal_quality": "no_video",
                }

            frame_results = []
            frames_checked = 0
            max_frames = 12

            while frames_checked < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                ok, buf = cv2.imencode(".jpg", frame)
                if not ok:
                    break
                partial = face_analyzer.analyze_frame(buf.tobytes())
                if isinstance(partial, dict) and not partial.get("error") and partial.get("detected"):
                    frame_results.append(partial)
                frames_checked += 1

            cap.release()

            if not frame_results:
                if frames_checked > 0:
                    return {
                        "detected": True,
                        "fatigue_level": 10,
                        "emotion": "Unknown",
                        "risk_score": 10,
                        "signal_quality": "no_face",
                        "eyelid_state": "unknown",
                        "brow_tension": 20.0,
                    }
                return {
                    "detected": False,
                    "fatigue_level": 0,
                    "emotion": "Unknown",
                    "risk_score": 0,
                    "signal_quality": "no_face",
                    "eyelid_state": "unknown",
                    "brow_tension": 20.0,
                }

            avg_fatigue = sum(r.get("fatigue_level", 0) for r in frame_results) / len(frame_results)
            max_risk = max(r.get("risk_score", 0) for r in frame_results)
            emotion = frame_results[0].get("emotion", "Unknown")
            eyelid_states = [r.get("eyelid_state") for r in frame_results if r.get("eyelid_state")]
            brow_values = [float(r.get("brow_tension", 0.0)) for r in frame_results]
            brow_avg = sum(brow_values) / len(brow_values) if brow_values else 20.0
            eyelid_state = "unknown"
            if eyelid_states:
                counts = {}
                for s in eyelid_states:
                    counts[s] = counts.get(s, 0) + 1
                eyelid_state = max(counts.items(), key=lambda x: x[1])[0]
            qualities = [r.get("signal_quality") for r in frame_results if r.get("signal_quality")]
            signal_quality = "good"
            if "low_light" in qualities:
                signal_quality = "low_light"
            elif "too_far" in qualities:
                signal_quality = "too_far"

            return {
                "detected": True,
                "fatigue_level": round(avg_fatigue),
                "emotion": emotion,
                "risk_score": max_risk,
                "signal_quality": signal_quality,
                "eyelid_state": eyelid_state,
                "brow_tension": float(brow_avg),
            }
        except Exception:
            return {
                "detected": False,
                "fatigue_level": 0,
                "emotion": "Unknown",
                "risk_score": 0,
                "signal_quality": "error",
            }
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

    return result
