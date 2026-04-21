
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { VitalsForm, VitalsData } from "@/components/patient/VitalsForm";
import { VideoRecorder } from "@/components/patient/VideoRecorder";
import { AudioRecorder } from "@/components/patient/AudioRecorder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Camera, Mic, CheckCircle2, AlertTriangle, Loader2, ArrowLeft, ArrowRight, ShieldCheck, HeartPulse, BrainCircuit, Stethoscope, Bell, Pill, CalendarDays, PhoneCall, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApiQuery, API_BASE } from "@/hooks/useApiQuery";
import { Input } from "@/components/ui/input";

type AnalysisRecord = {
  mongo_id?: string;
  id: string;
  risk: number;
  timeToRisk: string;
  timeMinutes: number;
  urgency: string;
  ttrLevel: string;
  condition: string;
  waitTime: string;
  timestamp: string;
};

type VitalsRisk = {
  risk_score?: number;
  error?: string;
};

type FaceAnalysis = {
  detected?: boolean;
  eyelid_state?: string;
  brow_tension?: number;
  emotion?: string;
  fatigue_level?: number;
  signal_quality?: string;
  error?: string;
};

type VoiceAnalysis = {
  stress_score?: number;
  no_speech?: boolean;
  stutter?: boolean;
  error?: string;
};

type TriageSummary = {
  urgency?: string;
  ttr_level?: string;
  time_to_risk?: string;
  time_minutes?: number;
  condition?: string;
  risk_score?: number;
};

type MultimodalResult = {
  status: string;
  data: {
    vitals_risk?: VitalsRisk;
    face_fatigue_index?: FaceAnalysis;
    voice_stress_score?: VoiceAnalysis;
    overall_risk_score?: number;
  };
  recommendation?: string;
  patient_id?: string;
  triage?: TriageSummary;
};

const formSchema = z.object({
  heartRate: z.coerce.number().min(30).max(220),
  systolic: z.coerce.number().min(50).max(250),
  diastolic: z.coerce.number().min(30).max(150),
  spo2: z.coerce.number().min(70).max(100),
  temp: z.coerce.number().min(30).max(45),
  pain: z.number().min(0).max(10),
  fatigue: z.number().min(0).max(10),
});

const demoResult: MultimodalResult = {
  status: "analyzed",
  data: {
    vitals_risk: {
      risk_score: 58,
    },
    face_fatigue_index: {
      detected: true,
      fatigue_level: 42,
      emotion: "Calm",
    },
    voice_stress_score: {
      stress_score: 35,
    },
    overall_risk_score: 58,
  },
  recommendation: "Continue monitoring",
  patient_id: "P001",
  triage: {
    urgency: "medium",
    ttr_level: "watch",
    time_to_risk: "45 min",
    time_minutes: 45,
    condition: "Observation Required",
    risk_score: 58,
  },
};

export default function PatientDashboard() {
  const patientId = "P001";
  const [activeTab, setActiveTab] = useState("vitals");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<MultimodalResult | null>(demoResult);
  const [lastVitals, setLastVitals] = useState<VitalsData | null>(null);
  const [dischargeSnippet, setDischargeSnippet] = useState<{ title: string; line: string } | null>(null);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isBookingAppointment, setIsBookingAppointment] = useState(false);
  const { toast } = useToast();

  const { data: history, isLoading: historyLoading } = useApiQuery<AnalysisRecord[]>(
    ["patient-analyses"],
    "/analyses?limit=6"
  );

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("vitalynDischargeSnippet_P001");
        if (stored) {
          const parsed = JSON.parse(stored) as { title?: string; line?: string };
          if (parsed && (parsed.title || parsed.line)) {
            setDischargeSnippet({
              title: parsed.title ?? "Discharge instructions",
              line: parsed.line ?? "",
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const form = useForm<VitalsData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heartRate: 72,
      systolic: 120,
      diastolic: 80,
      spo2: 98,
      temp: 36.5,
      pain: 2,
      fatigue: 3,
    },
  });

  const steps = [
    { id: "vitals", label: "Vitals", icon: Activity },
    { id: "video", label: "Face Scan", icon: Camera },
    { id: "voice", label: "Voice Check", icon: Mic },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      const vitals = form.getValues();
      setLastVitals(vitals);
      const formData = new FormData();
      
      formData.append("vitals", JSON.stringify({
        heart_rate: vitals.heartRate,
        bp_systolic: vitals.systolic,
        bp_diastolic: vitals.diastolic,
        spo2: vitals.spo2,
        temperature: vitals.temp,
        pain_level: vitals.pain,
        fatigue_level: vitals.fatigue
      }));

      if (videoBlob) {
        formData.append("face_video", videoBlob, "face.webm");
      }
      if (audioBlob) {
        formData.append("voice_sample", audioBlob, "voice.webm");
      }

      const response = await fetch(`${API_BASE}/analyze/multimodal`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Check-in Complete",
        description: "Your health data has been analyzed successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit health data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!appointmentTime) {
      toast({
        title: "Select a time",
        description: "Please choose an appointment time before booking.",
        variant: "destructive",
      });
      return;
    }

    setIsBookingAppointment(true);
    try {
      const response = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: patientId,
          appointment_time: appointmentTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      toast({
        title: "Appointment booked",
        description: "Your appointment has been added to the OPD queue.",
      });
      setAppointmentTime("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Booking failed",
        description: "Could not book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBookingAppointment(false);
    }
  };

  const data = result?.data || {};
  const vitalsRisk = data.vitals_risk || {};
  const faceAnalysis = data.face_fatigue_index || {};
  const voiceAnalysis = data.voice_stress_score || {};
  const overallRiskScore: number =
    data.overall_risk_score ??
    vitalsRisk.risk_score ??
    0;
  const triage = result?.triage || {};

  const vitalsSnapshot = lastVitals ?? form.getValues();
  const tempDisplay =
    typeof vitalsSnapshot.temp === "number" && !Number.isNaN(vitalsSnapshot.temp)
      ? vitalsSnapshot.temp.toFixed(1)
      : "--";
  const eyelidState = faceAnalysis.eyelid_state as string | undefined;
  const browTension =
    typeof faceAnalysis.brow_tension === "number" ? faceAnalysis.brow_tension as number : undefined;
  const hasRenalComorbidity = true;
  const vitalsConcerningForP001 =
    hasRenalComorbidity &&
    (vitalsSnapshot.heartRate >= 90 ||
      vitalsSnapshot.systolic >= 140 ||
      vitalsSnapshot.diastolic >= 90 ||
      vitalsSnapshot.temp >= 38 ||
      vitalsSnapshot.spo2 <= 94);

  let riskLabel = "Low";
  if (overallRiskScore >= 85) {
    riskLabel = "High";
  } else if (overallRiskScore >= 50) {
    riskLabel = "Moderate";
  }

  const nextCheckIn =
    triage.time_to_risk ||
    (riskLabel === "High" ? "15 min" : riskLabel === "Moderate" ? "45 min" : "4 hrs");

  const showHighRiskDoctorActions = triage.urgency === "high" || riskLabel === "High";

  const insights: { label: string; text: string; muted?: boolean }[] = [];

  if (vitalsRisk.error) {
    insights.push({
      label: "System",
      text: "Vitals engine is temporarily unavailable; using safest baseline in this demo.",
      muted: true,
    });
  } else if (typeof vitalsRisk.risk_score === "number") {
    if (vitalsConcerningForP001) {
      insights.push({
        label: "Vitals",
        text: "For your kidneys and diabetes, these readings are more concerning than for a typical patient. Let your care team know if you feel unwell or if numbers drift further from your usual range.",
      });
    } else if (vitalsRisk.risk_score < 30) {
      insights.push({
        label: "Vitals",
        text: "Vitals are within the expected range for this stage of recovery.",
      });
    } else if (vitalsRisk.risk_score < 70) {
      insights.push({
        label: "Vitals",
        text: "Vitals show early signs that may need closer observation.",
      });
    } else {
      insights.push({
        label: "Vitals",
        text: "Vitals indicate a high risk of clinical deterioration.",
      });
    }
  }

  if (faceAnalysis.error) {
    insights.push({
      label: "System",
      text: "Face analysis is offline in this build; only vitals are influencing the risk score.",
      muted: true,
    });
  } else if (faceAnalysis.detected) {
    const emotionText = faceAnalysis.emotion ? ` You currently look ${faceAnalysis.emotion.toLowerCase()} on camera.` : "";
    let eyeNote = "";
    if (eyelidState === "closed") {
      eyeNote = " Your eyes look mostly closed on camera, which can mean you are extremely tired or not fully awake for the check.";
    } else if (eyelidState === "partially_closed") {
      eyeNote = " Your eyelids look heavy, which can happen when you are exhausted or unwell.";
    }
    let browNote = "";
    if (typeof browTension === "number" && browTension >= 70) {
      browNote = " Your eyebrows also look pulled together, which often happens when someone is in pain or distress.";
    }
    if (faceAnalysis.fatigue_level >= 80) {
      insights.push({
        label: "Face",
        text: `Your face scan shows heavy eye tiredness and possible distress.${emotionText}${eyeNote}${browNote} This can happen after surgery or poor sleep, so pay attention to how you feel and use this together with your vitals and your doctor's advice.`,
      });
    } else if (faceAnalysis.fatigue_level >= 40) {
      insights.push({
        label: "Face",
        text: `Your face scan shows some signs of tiredness but not severe exhaustion.${emotionText}${eyeNote}${browNote} Keep following your plan, rest well, and repeat a scan if you feel your energy dropping further.`,
      });
    } else {
      insights.push({
        label: "Face",
        text: `Your face scan shows eyes open and alert with no strong fatigue markers.${emotionText}${eyeNote}${browNote} This is reassuring, but always combine it with how you feel and your doctor's guidance.`,
      });
    }
  } else {
    const quality = faceAnalysis.signal_quality as string | undefined;
    if (quality === "low_light") {
      insights.push({
        label: "Face",
        text: "Face scan could not see you clearly because the lighting was too low. Try again in a brighter room or facing a window; right now the system is relying mainly on your vitals.",
        muted: true,
      });
    } else if (quality === "too_far") {
      insights.push({
        label: "Face",
        text: "Face scan could not clearly see your face because you were too far from the camera. Move closer so your head and shoulders fill most of the frame, then repeat the scan.",
        muted: true,
      });
    } else {
      insights.push({
        label: "Face",
        text: "Face scan could not clearly see your face. Try again with your face centered in the frame and good lighting; for now the system is relying mainly on your vitals.",
        muted: true,
      });
    }
  }

  const noSpeech = voiceAnalysis.no_speech === true;
  const stutter = voiceAnalysis.stutter === true;

  if (voiceAnalysis.error) {
    insights.push({
      label: "System",
      text: "Voice analysis is offline in this build; your recording is captured but not yet scored.",
      muted: true,
    });
  } else if (noSpeech) {
    insights.push({
      label: "Voice",
      text: "We could not clearly hear any speech in your recording. Try speaking out loud for a few seconds in your normal or pained voice so we can analyze how you sound.",
      muted: true,
    });
  } else if (typeof voiceAnalysis.stress_score === "number") {
    if (voiceAnalysis.stress_score >= 60) {
      insights.push({
        label: "Voice",
        text: "Voice analysis indicates elevated stress in speech patterns.",
      });
    } else if (stutter) {
      insights.push({
        label: "Voice",
        text: "Your speech in this clip sounds broken or stuttered, which can happen when you are anxious, breathless, or in discomfort. If this was not intentional, repeat the voice check speaking slowly in one continuous sentence.",
      });
    } else if (voiceAnalysis.stress_score >= 25) {
      insights.push({
        label: "Voice",
        text: "Voice analysis shows mild stress markers; continue monitoring.",
      });
    } else {
      insights.push({
        label: "Voice",
        text: "Voice analysis shows relaxed speech with low stress markers.",
      });
    }
  }

  if (!insights.length) {
    insights.push({
      label: "System",
      text: "Models did not detect significant risk markers across vitals, face, or voice.",
      muted: true,
    });
  }

  const medications = [
    { name: "Apixaban", dose: "2.5 mg", schedule: "Twice daily" },
    { name: "Paracetamol", dose: "500 mg", schedule: "If pain > 3/10" },
    { name: "Pantoprazole", dose: "40 mg", schedule: "Once every morning" },
  ];
  const notifications = [
    "Evening vitals check-in due in 2 hours.",
    "Short video check scheduled with Dr. Chen at 7:00 PM.",
    "Log any new pain, dizziness, or breathlessness in the app.",
  ];

  return (
      <div className="relative z-10 min-h-screen bg-gradient-to-b from-[#3a3e61] via-[#3a3e61] to-[#f1ede2] font-sans selection:bg-[#f1ede2]/20 selection:text-[#3a3e61]">
        <Navbar />
        <div className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-3">
              <Link to="/" className="inline-flex items-center text-sm font-medium text-[#f1ede2]/80 hover:text-white mb-1 transition-colors px-4 py-2 rounded-full hover:bg-white/10 border border-transparent hover:border-white/40 bg-white/5">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to hero page
              </Link>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#fdfbf6] drop-shadow-sm">
                Your recovery dashboard
              </h1>
              <p className="text-sm sm:text-base text-[#f1ede2]/85 max-w-xl">
                See your latest check-in, medications, and alerts before starting a new Vitalyn scan.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#fdfbf6]/10 border border-[#fdfbf6]/30 rounded-2xl px-4 py-3 text-xs text-[#f1ede2] shadow-lg shadow-black/20">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdfbf6]/90 text-[#3a3e61]">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold tracking-wide uppercase text-[11px]">Patient P001</p>
                <p className="text-[11px] text-[#f1ede2]/80">Post-op day 3 • CKD on dialysis • Diabetes</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-75">
            <Card className="lg:col-span-2 border-0 shadow-xl shadow-[#111322]/25 bg-[#fdfbf6]/95 backdrop-blur-xl rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-[#111322]">
                    Latest vitals check-in
                  </CardTitle>
                  <CardDescription className="text-sm text-[#4b4f70]">
                    Logged from your latest Vitalyn check-in • Patient ID P001
                  </CardDescription>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  {riskLabel} risk
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-[#f1ede2] px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">Heart rate</p>
                    <p className="mt-1 text-2xl font-black text-[#111322]">{vitalsSnapshot.heartRate} bpm</p>
                    <p className="mt-1 text-xs text-[#4b4f70]">Target 65–90</p>
                  </div>
                  <div className="rounded-2xl bg-[#f1ede2] px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">Blood pressure</p>
                    <p className="mt-1 text-2xl font-black text-[#111322]">
                      {vitalsSnapshot.systolic}/{vitalsSnapshot.diastolic}
                    </p>
                    <p className="mt-1 text-xs text-[#4b4f70]">mmHg</p>
                  </div>
                  <div className="rounded-2xl bg-[#f1ede2] px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">SpO₂</p>
                    <p className="mt-1 text-2xl font-black text-[#111322]">{vitalsSnapshot.spo2}%</p>
                    <p className="mt-1 text-xs text-[#4b4f70]">Above 94% preferred</p>
                  </div>
                  <div className="rounded-2xl bg-[#f1ede2] px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">Temperature</p>
                    <p className="mt-1 text-2xl font-black text-[#111322]">{tempDisplay} °C</p>
                    <p className="mt-1 text-xs text-[#4b4f70]">Fever if ≥ 38.0</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e1d8c7] bg-white px-4 py-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3e61]/10 text-[#3a3e61]">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">Assigned doctor</p>
                      <p className="text-sm font-semibold text-[#111322]">Dr. Sarah Chen</p>
                      <p className="text-xs text-[#4b4f70]">Post-op rounds twice daily</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e1d8c7] bg-white px-4 py-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3e61]/10 text-[#3a3e9]">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">Procedure</p>
                      <p className="text-sm font-semibold text-[#111322]">Laparoscopic appendectomy</p>
                      <p className="text-xs text-[#4b4f70]">Post-op day 3 • CKD on dialysis • Diabetes</p>
                    </div>
                  </div>
                </div>

                {dischargeSnippet && (
                  <div className="mt-4 rounded-2xl border border-[#e1d8c7] bg-white px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-[#3a3e61]" />
                      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">
                        Prescription changes and alerts
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#111322]">
                      {dischargeSnippet.title}
                    </p>
                    {dischargeSnippet.line && (
                      <p className="mt-1 text-xs text-[#4b4f70]">
                        {dischargeSnippet.line}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e1d8c7] bg-white px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="h-4 w-4 text-[#3a3e61]" />
                      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">
                        Active medications
                      </p>
                    </div>
                    <ul className="space-y-2 text-xs text-[#4b4f70]">
                      {medications.map((m) => (
                        <li key={m.name} className="flex items-center justify-between">
                          <span className="font-medium text-[#111322]">{m.name}</span>
                          <span className="text-[11px]">{m.dose} • {m.schedule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[#e1d8c7] bg-white px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="h-4 w-4 text-[#3a3e61]" />
                      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">
                        Alerts and notifications
                      </p>
                    </div>
                    <ul className="space-y-2 text-xs text-[#4b4f70]">
                      {notifications.map((n, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-[#f97373]" />
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-0 shadow-xl shadow-black/20 bg-[#fdfbf6]/95 text-[#111322] rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold tracking-[0.2em] uppercase text-[#3a3e61]">
                    Check-in history
                  </CardTitle>
                  <CardDescription className="text-xs text-[#4b4f70]">
                    Recent multimodal analyses stored in the hospital record.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {(historyLoading ? Array.from({ length: 3 }) : history ?? []).map((item, i) => {
                    if (!history && historyLoading) {
                      return (
                        <div key={i} className="h-10 rounded-2xl bg-[#f1ede2]" />
                      );
                    }
                    const record = (history ?? [])[i] as AnalysisRecord;
                    if (!record) return null;
                    const date = new Date(record.timestamp);
                    const timeLabel = isNaN(date.getTime())
                      ? record.timestamp
                      : date.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
                    return (
                      <div
                        key={record.mongo_id ?? `${record.id}-${i}`}
                        className="rounded-2xl border border-[#e1d8c7] bg-[#fdfbf6] px-3 py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#7a7e9a]">
                            {record.id} • {record.condition}
                          </span>
                          <span className="text-[11px] text-[#4b4f70]">
                            {timeLabel}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center rounded-full border border-[#111322] px-2 py-0.5 text-[11px] font-semibold">
                            {Math.round(record.risk)}% risk
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#3a3e61] px-2 py-0.5 text-[10px] font-semibold text-[#f1ede2]">
                            {record.timeToRisk} to next risk window
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {!historyLoading && (!history || history.length === 0) && (
                    <p className="text-[11px] text-[#7a7e9a]">
                      Your future multimodal check-ins will appear here automatically.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl shadow-black/20 bg-[#111322]/90 text-[#fdfbf6] rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold tracking-[0.2em] uppercase text-[#f1ede2]/80">
                    AI summary
                  </CardTitle>
                  <CardDescription className="text-xs text-[#f1ede2]/80">
                    What Vitalyn sees from your vitals, face and voice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-[#f1ede2]/90">
                  {insights.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border px-3 py-2 flex gap-3 items-start ${
                        item.muted
                          ? "border-[#2a2d4f]/60 bg-[#181a33]/80"
                          : "border-[#2a2d4f] bg-[#181a33]"
                      }`}
                    >
                      <div
                        className={`mt-1 h-1.5 w-1.5 rounded-full ${
                          item.muted ? "bg-[#9ca3c7]" : "bg-[#f97373]"
                        }`}
                      />
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#c7cbe6] mb-1">
                          {item.label} {item.label === "System" ? "note" : "insight"}
                        </p>
                        <p className="text-[11px] text-[#fdfbf6]">{item.text}</p>
                      </div>
                    </div>
                  ))}
                  <p className="mt-3 text-[11px] text-[#f1ede2]/70">
                    This summary is for guidance only. Your doctor always makes the final call.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl shadow-black/20 bg-[#fdfbf6]/95 text-[#111322] rounded-3xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold tracking-[0.2em] uppercase text-[#3a3e61] flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Book appointment
                  </CardTitle>
                  <CardDescription className="text-xs text-[#4b4f70]">
                    Choose a time and add it to the OPD queue for your doctor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7a7e9a]">
                      Appointment time
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="datetime-local"
                        value={appointmentTime}
                        onChange={(event) => setAppointmentTime(event.target.value)}
                        className="bg-white border-[#e1d8c7] text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-[#7a7e9a]">
                      Your doctor will see this slot in the OPD CareQueue.
                    </p>
                  </div>
                  <Button
                    className="w-full h-10 text-xs font-semibold bg-[#111322] text-[#fdfbf6] border border-[#e1d8c7] hover:bg-black flex items-center justify-center gap-2 rounded-2xl"
                    onClick={handleBookAppointment}
                    disabled={isBookingAppointment}
                  >
                    {isBookingAppointment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    {isBookingAppointment ? "Booking..." : "Book appointment"}
                  </Button>
                </CardContent>
              </Card>
              {showHighRiskDoctorActions && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full h-10 text-xs font-semibold border-[#f97373]/70 text-[#111322] bg-[#fee2e2] hover:bg-[#fecaca] flex items-center justify-center gap-2 rounded-2xl"
                    onClick={() => {
                      toast({
                        title: "Doctor notified",
                        description: "Your assigned doctor has been notified about this high-risk check-in.",
                      });
                    }}
                  >
                    <Bell className="h-4 w-4" />
                    Notify assigned doctor
                  </Button>
                  <Button
                    className="w-full h-10 text-xs font-semibold bg-[#111322] text-[#fdfbf6] border border-[#e1d8c7] hover:bg-black flex items-center justify-center gap-2 rounded-2xl"
                    onClick={() => {
                      toast({
                        title: "Call started",
                        description: "In a real deployment this would start a call to your care team.",
                      });
                    }}
                  >
                    <PhoneCall className="h-4 w-4" />
                    Call doctor now
                  </Button>
                </div>
              )}
              <Button
                className="w-full h-12 text-sm font-semibold bg-[#fdfbf6] text-[#111322] border border-[#e1d8c7] rounded-2xl shadow-lg shadow-black/20 hover:bg-[#f1ede2]"
                onClick={() => setResult(null)}
              >
                Start new multimodal check-in
              </Button>
            </div>
          </div>

          <div className="relative flex justify-between max-w-lg mx-auto mb-12 mt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -z-10 rounded-full" />
            <div 
              className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 -z-10 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-3 bg-transparent group cursor-default">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 relative",
                    isActive ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-500/20 scale-110" : "bg-white border-slate-100 text-slate-300"
                  )}>
                    {isActive && <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20" />}
                    <step.icon className={cn("h-5 w-5 transition-transform duration-300", isCurrent ? "scale-110" : "")} />
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider transition-colors duration-300",
                    isCurrent ? "text-blue-700" : isActive ? "text-slate-600" : "text-slate-400"
                  )}>{step.label}</span>
                </div>
              );
            })}
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden ring-1 ring-slate-900/5 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="p-1">
                 {/* Hidden TabsList since we have custom stepper */}
                 <TabsList className="hidden">
                  {steps.map(step => (
                    <TabsTrigger key={step.id} value={step.id}>{step.label}</TabsTrigger>
                  ))}
                 </TabsList>
              </div>

              <div className="p-8 sm:p-10 min-h-[400px]">
                <TabsContent value="vitals" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Vital Signs</h3>
                    <p className="text-slate-500">Please enter your latest measurements from your wearable device.</p>
                  </div>
                  <VitalsForm form={form} />
                  <div className="mt-10 flex justify-end">
                    <Button onClick={() => setActiveTab("video")} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-8 rounded-xl h-12">
                      Next: Face Scan <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="video" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Facial Analysis</h3>
                    <p className="text-slate-500">Position your face in the frame to analyze fatigue markers.</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <VideoRecorder onRecordingComplete={(blob) => {
                      setVideoBlob(blob);
                      toast({ title: "Video saved", description: "Proceed to voice check." });
                    }} />
                  </div>
                  <div className="mt-10 flex justify-between">
                    <Button variant="ghost" onClick={() => setActiveTab("vitals")} className="text-slate-500 hover:text-slate-900">
                      Back
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("voice")} 
                      disabled={!videoBlob}
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-8 rounded-xl h-12 disabled:opacity-50"
                    >
                      Next: Voice Check <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="voice" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Voice Analysis</h3>
                    <p className="text-slate-500">Read the prompt aloud to analyze vocal biomarkers.</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <AudioRecorder onRecordingComplete={(blob) => {
                      setAudioBlob(blob);
                      toast({ title: "Audio saved", description: "Ready to submit." });
                    }} />
                  </div>
                  <div className="mt-10 flex justify-between">
                    <Button variant="ghost" onClick={() => setActiveTab("video")} className="text-slate-500 hover:text-slate-900">
                      Back
                    </Button>
                    <Button 
                      onClick={onSubmit} 
                      disabled={isSubmitting || !audioBlob}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 px-8 rounded-xl h-12 w-40"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Analysis"}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
          
          <div className="text-center">
             <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
               <ShieldCheck className="h-3 w-3" /> Encrypted & HIPAA Compliant
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
