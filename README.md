# Vitalyn – Multimodal Healthcare AI

Vitalyn is a dual‑sided multimodal healthcare system:
- Patient side: check‑ins from vitals, face video, and voice.
- Doctor side: OPD CareQueue, post‑op monitoring, alerts, and digital reports.

The system runs real backend models (no mocking) and integrates:
- Vitals risk engine (Random Forest)
- Face fatigue model
- Voice stress model
- NVIDIA NIM–powered reasoning agent for SOAP‑style clinical reports

---

## Tech Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn‑ui
- Backend: FastAPI (Python)
- ML: scikit‑learn, PyTorch, Librosa, Pandas, NumPy
- Reasoning: NVIDIA NIM via OpenAI SDK (`meta/llama-3.3-70b-instruct`)
- Data sources:
  - Synthetic vitals generator
  - MIMIC‑III (demo) for real vitals training
  - RAVDESS for voice stress model

---

## Quick Start

### 1. Frontend (UI)

From the project root:

```sh
npm install
npm run dev
```

The main demo pages:
- `/` – Marketing overview
- `/post-op` – Post‑operative monitoring dashboard
- `/opd-queue` – OPD CareQueue with AI and appointment queues
- `/alerts` – Live alerts stream
- `/reports` – Digital clinic reports per patient
- `/patient` – Patient self‑service dashboard

### 2. Backend (API + ML)

From the `backend` folder:

```sh
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Key endpoints:
- `GET /` – Health check
- `POST /analyze/vitals` – Vitals‑only risk analysis
- `POST /analyze/multimodal` – Vitals + face + voice fusion with reasoning
- `GET /analyses` – Stored analyses (used by `/post-op`, `/patient`, `/reports`)
- `GET /patients` – Current risk‑sorted queue
- `GET /appointments`, `POST /appointments` – Booked appointment slots from patient app

Configure NVIDIA NIM by setting:

```sh
export NVIDIA_API_KEY=your_key_here
```

---

## Model Training & Accuracy

### Vitals Risk Model (Synthetic)

Script: `backend/app/training/train_vitals.py`

- Data: synthetic clinical vitals (10,000 samples)
- Model: RandomForestClassifier (sklearn), 100 trees
- Test split: 20%
- Reported performance (from running the script in this repo):

```text
Model Accuracy: 1.0000

Classification Report:
              precision    recall  f1-score   support

         0.0       1.00      1.00      1.00      1185
         1.0       1.00      1.00      1.00       497
         2.0       1.00      1.00      1.00       318

    accuracy                           1.00      2000
   macro avg       1.00      1.00      1.00      2000
weighted avg       1.00      1.00      1.00      2000
```

This synthetic model is used as a fallback when a real clinical model is not available.

### Vitals Risk Model (MIMIC‑III)

Script: `backend/app/training/train_vitals_real.py`

- Data: MIMIC‑III demo vitals (requires local dataset under `public/mimic-iii-clinical-database-demo-1.4`)
- Model: RandomForestClassifier with class weighting
- Metrics: prints full classification report and accuracy (e.g. `Accuracy: 0.xx`)

To reproduce:

```sh
cd backend
python app/training/train_vitals_real.py
```

The exact accuracy depends on the MIMIC‑III subset present on your machine.

### Voice Stress Model

Script: `backend/app/training/train_voice_real.py`

- Data: RAVDESS emotion dataset (audio), mapped to Low / Medium / High stress.
- Model: RandomForestClassifier
- Metrics: prints `Model Accuracy: {acc:.4f}` and a detailed classification report.

To run:

```sh
cd backend
python app/training/train_voice_real.py
```

Ensure the RAVDESS audio is available under `public` as expected by the script.

### Face Fatigue Model

Script: `backend/app/training/train_face_real.py`

- Data: facial video frames (clinic‑specific dataset expected)
- Model: simple CNN in PyTorch
- Metrics: logs per‑epoch training accuracy and final `Test Accuracy: XX.XX%`.

To run:

```sh
cd backend
python app/training/train_face_real.py
```

The accuracy will depend on your local dataset and GPU/CPU environment.

---

## Clinical Reasoning & Reports

The backend’s reasoning agent in `backend/app/models/reasoning.py`:
- Calls NVIDIA NIM (if `NVIDIA_API_KEY` is configured) to generate a structured SOAP‑style JSON note.
- Falls back to a deterministic heuristic when NIM is unavailable.

Each multimodal analysis stores this JSON as `clinical_analysis` and the `/reports` page renders it as a digital clinic document (Subjective, Objective, Assessment, Plan, Alert Level, Reasoning) per patient.

---

## Development Notes

- Frontend linting: `npm run lint`
- Frontend tests: `npm test` (Vitest)
- Backend dependencies: `backend/requirements.txt`
