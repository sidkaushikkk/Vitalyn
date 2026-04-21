from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import json
import os
from datetime import datetime
import uuid
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):  # type: ignore[no-redef]
        return None
from pymongo import MongoClient

from app.models.vitals import analyze_vitals
from app.models.face import analyze_face
from app.models.voice import analyze_voice
from app.models.fusion import calculate_risk
from app.models.reasoning import reasoning_agent

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "vitalyn")

mongo_client = MongoClient(MONGODB_URI) if MONGODB_URI else None
mongo_db = mongo_client[MONGODB_DB_NAME] if mongo_client is not None else None
analyses_collection = mongo_db["analyses"] if mongo_db is not None else None
users_collection = mongo_db["users"] if mongo_db is not None else None
documents_collection = mongo_db["documents"] if mongo_db is not None else None

app = FastAPI(title="Vitalyn API", description="Multimodal Healthcare Intelligence Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

patients_db = []
appointments_db = []
documents_db = []


class VitalsInput(BaseModel):
    heart_rate: float
    bp_systolic: float
    bp_diastolic: float
    spo2: float
    temperature: float
    pain_level: int
    fatigue_level: int


class AppointmentRequest(BaseModel):
    patient_id: str
    appointment_time: str


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


class PatientDocument(BaseModel):
    id: str
    patient_id: str
    filename: str
    stored_path: str
    content_type: Optional[str] = None
    uploaded_at: str
    note: Optional[str] = None
    size_bytes: Optional[int] = None


DEMO_USERS = {
    "patient": {
        "email": "patient123@gmail.com",
        "password": "patient123",
    },
    "doctor": {
        "email": "doctor123@gmail.com",
        "password": "doctor123",
    },
}

@app.get("/")
def health_check():
    return {"status": "active", "system": "Vitalyn Core"}


@app.post("/auth/login")
def login(payload: LoginRequest):
    role_key = payload.role.lower()

    if role_key not in DEMO_USERS:
        return {"success": False, "error": "Invalid role"}

    expected = DEMO_USERS[role_key]

    if payload.email != expected["email"] or payload.password != expected["password"]:
        return {"success": False, "error": "Invalid credentials"}

    user_doc = {
        "email": expected["email"],
        "role": role_key,
    }

    if users_collection is not None:
        users_collection.update_one(
            {"email": expected["email"]},
            {"$set": user_doc},
            upsert=True,
        )

    return {
        "success": True,
        "email": expected["email"],
        "role": role_key,
    }

@app.get("/patients")
def get_patients():
    """
    Get the list of patients in the queue (sorted by risk desc).
    """
    # Sort by risk (descending)
    sorted_patients = sorted(patients_db, key=lambda x: x['risk'], reverse=True)
    return sorted_patients


@app.get("/appointments")
def list_appointments():
    sorted_appointments = sorted(
        appointments_db,
        key=lambda x: x.get("appointment_time") or "",
    )
    return sorted_appointments


@app.post("/appointments")
def create_appointment(payload: AppointmentRequest):
    appointment = {
        "id": f"A{len(appointments_db) + 1:03d}",
        "patient_id": payload.patient_id,
        "appointment_time": payload.appointment_time,
        "created_at": datetime.now().isoformat(),
        "status": "scheduled",
    }
    appointments_db.append(appointment)
    return appointment


@app.get("/analyses")
def list_analyses(limit: int = 10):
    items = []

    if analyses_collection is not None:
        cursor = analyses_collection.find().sort("timestamp", -1).limit(limit)
        for doc in cursor:
            doc_copy = dict(doc)
            doc_copy["mongo_id"] = str(doc_copy.pop("_id", ""))
            ts = doc_copy.get("timestamp")
            if isinstance(ts, datetime):
                doc_copy["timestamp"] = ts.isoformat()
            items.append(doc_copy)
    else:
        items = sorted(patients_db, key=lambda x: x["timestamp"], reverse=True)[:limit]

    return items

@app.post("/analyze/vitals")
def analyze_patient_vitals(data: VitalsInput):
    """
    Endpoint for continuous wearable data + manual symptom entry.
    """
    result = analyze_vitals(data)
    return {
        "module": "vitals",
        "data": result,
        "status": "success"
    }

@app.post("/analyze/multimodal")
async def analyze_multimodal(
    vitals: str = Form(...),  # JSON string of vitals
    face_video: Optional[UploadFile] = File(None),
    voice_sample: Optional[UploadFile] = File(None)
):
    """
    The core Vitalyn endpoint.
    Accepts Vitals (JSON), Face Video (Blob), and Voice (Blob) simultaneously.
    """
    try:
        vitals_dict = json.loads(vitals)
        # Convert dict to Pydantic model for consistency
        vitals_obj = VitalsInput(**vitals_dict)
    except Exception as e:
        return {"error": f"Invalid vitals JSON: {str(e)}"}
    
    results = {
        "vitals_risk": {},
        "face_fatigue_index": {},
        "voice_stress_score": {},
        "overall_risk_score": 0
    }
    
    # 1. Process Vitals
    results["vitals_risk"] = analyze_vitals(vitals_obj)
    
    # 2. Process Video (if provided)
    if face_video:
        video_bytes = await face_video.read()
        results["face_fatigue_index"] = analyze_face(video_bytes)
        
    # 3. Process Voice (if provided)
    if voice_sample:
        audio_bytes = await voice_sample.read()
        results["voice_stress_score"] = analyze_voice(audio_bytes)
    
    # 4. Fusion Logic
    final_risk = calculate_risk(results)
    results["overall_risk_score"] = final_risk
    
    # 5. Advanced Medical Reasoning (Ambient Provider Agent)
    # Generates a SOAP note and clinical explanation
    try:
        clinical_insight = reasoning_agent.generate_soap_note(
            patient_data={"vitals": vitals_dict, "id": "TEMP_ID"},
            vitals_analysis=results["vitals_risk"],
            face_analysis=results["face_fatigue_index"],
            voice_analysis=results["voice_stress_score"],
            transcript="Patient explicitly mentioned feeling dizzy and nauseous." # Placeholder for ASR
        )
        results["clinical_analysis"] = clinical_insight
    except Exception as e:
        print(f"Reasoning Error: {e}")
        results["clinical_analysis"] = {"error": "Reasoning agent unavailable"}
    
    patient_id = f"P{len(patients_db) + 1:03d}"

    vitals_block = results.get("vitals_risk") or {}
    face_block = results.get("face_fatigue_index") or {}
    voice_block = results.get("voice_stress_score") or {}

    vitals_score = float(vitals_block.get("risk_score") or 0.0)
    face_fatigue = float(face_block.get("fatigue_level") or 0.0)
    voice_stress = float(voice_block.get("stress_score") or 0.0)

    has_any_abnormal = (
        vitals_score >= 30.0
        or face_fatigue >= 40.0
        or voice_stress >= 35.0
    )

    has_severe_any = (
        vitals_score >= 70.0
        or face_fatigue >= 80.0
        or voice_stress >= 70.0
    )

    if final_risk >= 85 or has_severe_any:
        urgency = "high"
        ttr_level = "critical"
        time_to_risk = "15 min"
        time_minutes = 15
        condition = "Critical Decompensation"
    elif final_risk >= 60 or (has_any_abnormal and final_risk >= 40):
        urgency = "medium"
        ttr_level = "watch"
        time_to_risk = "45 min"
        time_minutes = 45
        condition = "Observation Required"
    elif has_any_abnormal or final_risk >= 30:
        urgency = "medium"
        ttr_level = "watch"
        time_to_risk = "2 hours"
        time_minutes = 120
        condition = "Early Warning"
    else:
        urgency = "low"
        ttr_level = "safe"
        time_to_risk = "4 hours"
        time_minutes = 240
        condition = "Stable"
        
    patient_entry = {
        "id": patient_id,
        "risk": final_risk,
        "timeToRisk": time_to_risk,
        "timeMinutes": time_minutes,
        "urgency": urgency,
        "ttrLevel": ttr_level,
        "condition": condition,
        "waitTime": "Just now",
        "timestamp": datetime.now().isoformat(),
        "details": results,
        "vitals": vitals_dict,
    }

    if analyses_collection is not None:
        analyses_collection.insert_one(patient_entry)

    patients_db.append(patient_entry)

    return {
        "status": "analyzed",
        "data": results,
        "recommendation": "Immediate attention required" if final_risk > 80 else "Continue monitoring",
        "patient_id": patient_id,
        "triage": {
            "urgency": urgency,
            "ttr_level": ttr_level,
            "time_to_risk": time_to_risk,
            "time_minutes": time_minutes,
            "condition": condition,
            "risk_score": final_risk,
        },
    }


@app.post("/patient-documents")
async def upload_patient_document(
    patient_id: str = Form(...),
    note: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    upload_root = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(upload_root, exist_ok=True)

    doc_id = str(uuid.uuid4())
    safe_name = file.filename or "document"
    stored_name = f"{doc_id}_{safe_name}"
    stored_path = os.path.join(upload_root, stored_name)

    content = await file.read()

    with open(stored_path, "wb") as f:
        f.write(content)

    doc = PatientDocument(
        id=doc_id,
        patient_id=patient_id,
        filename=safe_name,
        stored_path=stored_path,
        content_type=file.content_type,
        uploaded_at=datetime.now().isoformat(),
        note=note,
        size_bytes=len(content),
    ).model_dump()

    documents_db.append(doc)

    if documents_collection is not None:
        documents_collection.insert_one(doc)

    return doc


@app.get("/patient-documents")
def list_patient_documents(patient_id: Optional[str] = None):
    docs = []

    if documents_collection is not None:
        query = {}
        if patient_id:
            query["patient_id"] = patient_id
        cursor = documents_collection.find(query).sort("uploaded_at", -1)
        for doc in cursor:
            doc_copy = dict(doc)
            doc_copy.pop("_id", None)
            docs.append(doc_copy)
    else:
        if patient_id:
            docs = [d for d in documents_db if d.get("patient_id") == patient_id]
        else:
            docs = list(documents_db)

    return docs


@app.get("/patient-documents/{doc_id}/file")
def download_patient_document(doc_id: str):
    doc = None

    if documents_collection is not None:
        found = documents_collection.find_one({"id": doc_id})
        if found:
            found.pop("_id", None)
            doc = found
    else:
        for item in documents_db:
            if item.get("id") == doc_id:
                doc = item
                break

    if not doc:
        return {"error": "Document not found"}

    path = doc.get("stored_path")

    if not path or not os.path.exists(path):
        return {"error": "File not available"}

    return FileResponse(
        path,
        filename=doc.get("filename") or "document",
        media_type=doc.get("content_type") or "application/octet-stream",
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
