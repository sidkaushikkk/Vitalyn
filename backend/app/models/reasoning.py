import json
import os
from datetime import datetime

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):  # type: ignore[no-redef]
        return None

from openai import OpenAI

# Load environment variables (API Key)
load_dotenv()

class MedicalReasoningAgent:
    """
    Real 'Ambient Provider Voice Agent' reasoning using NVIDIA NIM.
    Connects to NVIDIA NIMs:
    - Reasoning: meta/llama-3.3-70b-instruct
    """
    
    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.base_url = "https://integrate.api.nvidia.com/v1"
        self.model_name = "meta/llama-3.3-70b-instruct"
        
        if self.api_key:
            self.client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key
            )
            print("Connected to NVIDIA Nemotron NIM.")
        else:
            self.client = None
            print("Warning: NVIDIA_API_KEY not found. Using fallback simulation.")

    def generate_soap_note(self, patient_data, vitals_analysis, face_analysis, voice_analysis, transcript=None):
        """
        Generates a structured SOAP note based on multimodal inputs using Generative AI.
        """
        
        # 1. Construct the Context Window
        context = {
            "timestamp": datetime.now().isoformat(),
            "patient_id": patient_data.get("id", "Unknown"),
            "vitals": {
                "measurements": patient_data.get("vitals", {}),
                "ai_analysis": vitals_analysis
            },
            "face_analysis": face_analysis,
            "voice_analysis": voice_analysis,
            "patient_transcript": transcript or "[No verbal input recorded]"
        }
        
        # 2. Formulate the Prompt
        system_prompt = """
        You are an advanced medical reasoning AI assistant (Ambient Provider Agent).
        Your task is to analyze multimodal patient data and generate a structured SOAP note in strict JSON format.
        
        Be precise, clinical, and data-driven.
        If the 'ai_analysis' indicates high risk (e.g. Sepsis), prioritize that in your Assessment.
        
        OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
        {
            "subjective": "Patient reports...",
            "objective": "Vitals show... Facial analysis indicates...",
            "assessment": "High probability of...",
            "plan": "Immediate actions...",
            "alert_level": "Critical" | "Watch" | "Stable",
            "reasoning": "Why this alert level was chosen"
        }
        """
        
        user_message = f"Analyze this patient data and provide the SOAP note:\n{json.dumps(context, indent=2)}"
        
        # 3. Call NVIDIA NIM (if configured)
        if self.client:
            try:
                completion = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    temperature=0.2,
                    top_p=0.7,
                    max_tokens=1024,
                    response_format={"type": "json_object"},
                )
                
                content = completion.choices[0].message.content
                return json.loads(content)
                
            except Exception as e:
                print(f"NVIDIA Inference Error: {e}. Falling back to simulation.")
                return self._mock_inference(context)
        else:
            return self._mock_inference(context)

    def _mock_inference(self, context):
        """
        Heuristic fallback when API is unavailable.
        """
        vitals_risk = context["vitals"]["ai_analysis"].get("risk_score", 0)
        is_sepsis = context["vitals"]["ai_analysis"].get("risk_class", 0) == 1
        
        alert_level = "Stable"
        plan = "Continue monitoring."
        assessment = "Patient is stable."
        
        if vitals_risk > 80 or is_sepsis:
            alert_level = "Critical"
            assessment = "Potential Sepsis detected based on vital signs (MIMIC-III model)."
            plan = "Initiate Sepsis Protocol (Lactate, Cultures, Antibiotics). Immediate MD evaluation."
        elif vitals_risk > 50:
            alert_level = "Watch"
            assessment = "Abnormal vitals detected. Patient showing signs of physiological stress."
            plan = "Repeat vitals in 15 mins. Observe for deterioration."
            
        return {
            "subjective": f"Patient input: {context['patient_transcript']}",
            "objective": f"HR: {context['vitals']['measurements'].get('heart_rate')} bpm. Face Fatigue: {context['face_analysis'].get('fatigue_level', 0)}/10. Voice Stress: {context['voice_analysis'].get('stress_score', 0)}/100.",
            "assessment": assessment,
            "plan": plan,
            "alert_level": alert_level,
            "reasoning": f"Fallback logic (API unavailable). Risk Score: {vitals_risk}"
        }

# Singleton instance
reasoning_agent = MedicalReasoningAgent()
