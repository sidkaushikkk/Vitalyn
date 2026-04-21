import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { TimeToRiskBadge } from "@/components/TimeToRiskBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  User,
  ArrowRight,
  HeartPulse,
  Thermometer
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { useApiQuery } from "@/hooks/useApiQuery";

const recoveryData = [
  { day: "Day 1", risk: 82, vitals: 45 },
  { day: "Day 2", risk: 70, vitals: 55 },
  { day: "Day 3", risk: 55, vitals: 65 },
  { day: "Day 4", risk: 48, vitals: 70 },
  { day: "Day 5", risk: 35, vitals: 78 },
  { day: "Day 6", risk: 25, vitals: 85 },
  { day: "Day 7", risk: 18, vitals: 90 },
];

interface AnalysisEntry {
  id: string;
  risk?: number;
  timeToRisk?: string;
  timeMinutes?: number;
  urgency?: string;
  ttrLevel?: string;
  condition?: string;
  waitTime?: string;
  timestamp?: string;
  vitals?: {
    heart_rate?: number;
    spo2?: number;
    temperature?: number;
  };
}

const patients = [
  {
    id: "P001",
    name: "Patient P001",
    surgery: "Laparoscopic appendectomy • CKD on dialysis • Type 2 diabetes",
    trend: "improving" as const,
    currentRisk: 18,
    ttr: "8 hours",
    ttrLevel: "safe" as const,
    urgency: "low" as const,
    vitals: { hr: 72, spo2: 98, temp: 98.6 }
  },
  {
    id: "P002",
    name: "Patient Beta",
    surgery: "Cardiac Bypass",
    trend: "deteriorating" as const,
    currentRisk: 72,
    ttr: "45 min",
    ttrLevel: "critical" as const,
    urgency: "high" as const,
    vitals: { hr: 110, spo2: 92, temp: 100.2 }
  },
  {
    id: "P003",
    name: "Patient Gamma",
    surgery: "Knee Replacement",
    trend: "stable" as const,
    currentRisk: 30,
    ttr: "3 hours",
    ttrLevel: "watch" as const,
    urgency: "medium" as const,
    vitals: { hr: 85, spo2: 96, temp: 99.1 }
  },
];

export default function PostOpMonitoring() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const initialId = searchParams.get("patient");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialId ?? patients[0].id);
  const [editorTitle, setEditorTitle] = useState("Update today's prescription and alerts");
  const [editorLine, setEditorLine] = useState("Summarise medication changes, monitoring plan, and when alerts should fire.");
  const { data: analyses } = useApiQuery<AnalysisEntry[]>(["analyses"], "/analyses?limit=20");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const latestP001 = (analyses ?? []).find((entry) => entry.id === "P001");

  const computedPatients = patients.map((patient) => {
    if (!latestP001 || patient.id !== "P001") {
      return patient;
    }

    const backendHr = latestP001.vitals?.heart_rate;
    const backendSpo2 = latestP001.vitals?.spo2;
    const backendTemp = latestP001.vitals?.temperature;

    const currentRisk = typeof latestP001.risk === "number" ? Math.round(latestP001.risk) : patient.currentRisk;
    const ttr = latestP001.timeToRisk ?? patient.ttr;
    const ttrLevel = (latestP001.ttrLevel as typeof patient.ttrLevel) ?? patient.ttrLevel;
    const urgency = (latestP001.urgency as typeof patient.urgency) ?? patient.urgency;

    return {
      ...patient,
      currentRisk,
      ttr,
      ttrLevel,
      urgency,
      vitals: {
        hr: backendHr ?? patient.vitals.hr,
        spo2: backendSpo2 ?? patient.vitals.spo2,
        temp: backendTemp ?? patient.vitals.temp,
      },
    };
  });

  const selectedPatient =
    computedPatients.find((patient) => patient.id === selectedPatientId) ?? computedPatients[0];

  const handleSaveSnippet = () => {
    try {
      const key = `vitalynDischargeSnippet_${selectedPatient.id}`;
      const payload = { title: editorTitle, line: editorLine };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const visiblePatients = initialId
    ? computedPatients.filter((patient) => patient.id === initialId)
    : computedPatients;

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "improving") return (
      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-100">
        <TrendingDown className="h-3 w-3" />
        <span>Improving</span>
      </div>
    );
    if (trend === "deteriorating") return (
      <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium border border-red-100">
        <TrendingUp className="h-3 w-3" />
        <span>Deteriorating</span>
      </div>
    );
    return (
      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-medium border border-amber-100">
        <Activity className="h-3 w-3" />
        <span>Stable</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-white/15 bg-white/5 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur-xl">
          <div>
            <h2 className="text-sm sm:text-xs font-semibold tracking-[0.18em] text-[#f1ede2]/80 uppercase">
              Post-Operative Monitoring
            </h2>
            <p className="mt-1 text-base sm:text-lg font-semibold text-[#fdfbf6]">
              Real-time recovery tracking and risk prediction
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#fdfbf6]/10 border border-[#fdfbf6]/30 rounded-2xl shadow-sm text-xs sm:text-sm font-medium text-[#fdfbf6]">
              <span className="text-[#f1ede2]/80 mr-2 uppercase tracking-[0.16em] text-[10px]">Last Update</span>
              <span className="font-semibold">Just now</span>
            </div>
          </div>
        </div>

        {/* Patient Selection Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {visiblePatients.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer hover:-translate-y-1",
                selectedPatient.id === p.id
                  ? "bg-white border-blue-500/50 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20"
                  : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/50"
              )}
              onClick={() => setSelectedPatientId(p.id)}
            >
              {selectedPatient.id === p.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
              )}
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                      p.id === "P001" ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20" : 
                      p.id === "P002" ? "bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/20" : 
                      "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20"
                    )}>
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded-md inline-block">{p.id}</p>
                    </div>
                  </div>
                  <TrendIcon trend={p.trend} />
                </div>
                
                <div className="pt-2">
                  <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-bold">Risk Analysis</div>
                  <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                    <RiskBadge level={p.urgency} />
                    <div className="h-4 w-px bg-slate-200" />
                    <TimeToRiskBadge time={p.ttr} level={p.ttrLevel} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-1 border-t border-slate-50 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                    {p.surgery}
                  </span>
                  <ArrowRight className={cn(
                    "h-4 w-4 transition-all duration-300",
                    selectedPatient.id === p.id ? "text-blue-600 translate-x-1" : "text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1"
                  )} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Monitoring Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chart */}
          <Card className="lg:col-span-2 border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl">
            <CardHeader className="border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-white pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                      <Activity className="h-5 w-5" />
                    </div>
                    Recovery Trajectory
                  </CardTitle>
                  <CardDescription className="text-slate-500 ml-1">Real-time Risk Score vs. Vital Stability Index</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/30"></span>
                      <span className="font-bold text-slate-600">Risk Score</span>
                   </div>
                   <div className="w-px h-3 bg-slate-200" />
                   <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span>
                      <span className="font-bold text-slate-600">Vitals Index</span>
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-[300px] w-full rounded-xl" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recoveryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVitals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: 12,
                        }}
                        itemStyle={{ padding: 0 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="risk" 
                        stroke="#f43f5e" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRisk)" 
                        activeDot={{ r: 6, strokeWidth: 0, className: "animate-pulse" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="vitals" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorVitals)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Info Panel */}
          <div className="space-y-6">
             {/* Vitals Card */}
             <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100/50">
                   <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      Live Vitals
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid gap-4">
                   <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
                            <Activity className="h-5 w-5" />
                         </div>
                         <span className="text-sm font-semibold text-slate-600">Heart Rate</span>
                      </div>
                      <span className="text-2xl font-black text-slate-900">{selectedPatient.vitals.hr} <span className="text-xs text-slate-400 font-normal ml-1">bpm</span></span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                            <Activity className="h-5 w-5" />
                         </div>
                         <span className="text-sm font-semibold text-slate-600">SpO2</span>
                      </div>
                      <span className="text-2xl font-black text-slate-900">{selectedPatient.vitals.spo2}<span className="text-lg text-slate-400 font-normal">%</span></span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm">
                            <Thermometer className="h-5 w-5" />
                         </div>
                         <span className="text-sm font-semibold text-slate-600">Temp</span>
                      </div>
                      <span className="text-2xl font-black text-slate-900">{selectedPatient.vitals.temp}<span className="text-lg text-slate-400 font-normal">°F</span></span>
                   </div>
                </CardContent>
             </Card>

             {/* Critical Alert Box */}
             {selectedPatient.urgency === "high" && (
              <Card className="border-0 bg-gradient-to-br from-rose-50 to-rose-100/50 shadow-lg shadow-rose-900/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-white flex items-center justify-center text-rose-600 shadow-sm ring-1 ring-rose-100 animate-pulse">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-rose-700">Critical Deterioration</h4>
                      <p className="text-sm text-rose-600/90 mt-1 leading-relaxed font-medium">
                        Predictive model indicates high probability of adverse event within <span className="bg-white/50 px-1.5 py-0.5 rounded text-rose-800 font-bold border border-rose-200/50">{selectedPatient.ttr}</span>.
                      </p>
                      <Button size="sm" className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-lg shadow-rose-600/20">
                        View Analysis Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* P001 chronic disease and treatment program overview */}
            {selectedPatient.id === "P001" && (
              <>
                <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 bg-slate-50/60 border-b border-slate-100/70">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                      <HeartPulse className="h-4 w-4 text-emerald-600" />
                      CKD on dialysis · Clinic-administered program
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      End-stage kidney disease on maintenance haemodialysis, coordinated entirely by the dialysis clinic administration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Dialysis schedule:</span>{" "}
                        Mon / Wed / Fri, 07:00–10:00, day-care unit. Bookings, machine allocation,
                        and staffing are handled by the clinic administration.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Responsible team:</span>{" "}
                        Nephrologist + dialysis nursing + clinic coordinator. All anticoagulation,
                        fluid removal targets, and access care orders are captured in the clinic system.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Access and precautions:</span>{" "}
                        Right forearm AV fistula – no IV lines, BP cuff, or blood draws on this arm. Post-op
                        fluid orders are reconciled with the dialysis prescription each session.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Administrative notes:</span>{" "}
                        Transport coordination, dialysis billing, and appointment reminders are generated by the
                        clinic administration dashboard; patient does not need to manage bookings manually.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 bg-slate-50/60 border-b border-slate-100/70">
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                      <Thermometer className="h-4 w-4 text-amber-500" />
                      Diabetes and post-op medication plan
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Type 2 diabetes on insulin with all prescriptions and monitoring managed through the clinic.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Glycaemic plan:</span>{" "}
                        Basal insulin at night plus correctional insulin around meals, with dose adjustments
                        entered centrally by the clinic doctor and synced to this dashboard.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Monitoring:</span>{" "}
                        Capillary glucose before breakfast and dinner while inpatient. Alerts fire to the
                        clinic team if readings are &gt; 250 mg/dL or &lt; 80 mg/dL.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Medication governance:</span>{" "}
                        All diabetes, dialysis, and post-op prescriptions are reconciled in a single
                        medication list managed by clinic administration, including anticoagulation, antibiotics,
                        insulin, and pain control.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <p>
                        <span className="font-semibold text-slate-800">Patient-facing summary:</span>{" "}
                        The patient sees a simplified schedule (dialysis days, insulin times, wound check visits),
                        while this dashboard keeps the full treatment plan and responsible clinic teams.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Interactive Text Edit-style UI */}
        <Card className="mt-6 border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold tracking-[0.25em] text-slate-400 uppercase">
                  Advice · Medications · Alerts
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                  Refine advice, medications, and alerts while keeping the risk story clear.
                </h3>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed">
                  Use this panel to practice how you explain {`"`}time to risk{`"`} and to
                  fine-tune the medication plan and notification rules. Changes here affect
                  only this preview, so doctors can safely adjust wording and orders during
                  the demo.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full px-5 h-10 border-slate-300 text-slate-800 hover:bg-slate-900 hover:text-white transition-colors"
                  onClick={() => {
                    setEditorTitle("Clinical advice, medications, and alerts reviewed by your doctor");
                    setEditorLine(
                      "Your medicines, monitoring schedule, and alert thresholds have been confirmed. Follow this plan and seek urgent help if new warning signs appear sooner than expected."
                    );
                  }}
                >
                  Reset to standard advice and medication sheet
                </Button>
              </div>

              <div className="relative">
                <div className="h-56 md:h-64 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="mx-6 md:mx-10">
                      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase mb-2">
                        Prescription & notifications summary
                      </p>
                      <p className="text-lg md:text-xl font-semibold text-slate-900">
                        {editorTitle}
                      </p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md">
                        {editorLine}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute left-4 right-4 -bottom-6 md:left-auto md:right-6 md:w-72 md:-bottom-10 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      T
                    </span>
                    Text Edit
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                        Heading
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900/80"
                        value={editorTitle}
                        onChange={(e) => setEditorTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                        Supporting line
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs md:text-sm text-slate-900 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900/80"
                        value={editorLine}
                        onChange={(e) => setEditorLine(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="mt-2 w-full bg-slate-900 text-white hover:bg-slate-800"
                      onClick={handleSaveSnippet}
                    >
                      Save to patient dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
