import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { TimeToRiskBadge } from "@/components/TimeToRiskBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Clock, Users, Zap, TrendingUp, AlertTriangle, Filter, MoreHorizontal, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useApiQuery } from "@/hooks/useApiQuery";

type UrgencyLevel = "low" | "medium" | "high";
type TTRLevel = "safe" | "watch" | "critical";

interface Patient {
  id: string;
  risk: number;
  timeToRisk: string;
  timeMinutes: number;
  urgency: UrgencyLevel;
  ttrLevel: TTRLevel;
  condition: string;
  waitTime: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_time: string;
  created_at?: string;
  status?: string;
}

const doctors = [
  { id: "mehta", name: "Dr. Mehta", label: "OPD A • Surgical ward" },
  { id: "rao", name: "Dr. Rao", label: "OPD B • General medicine" },
  { id: "iyer", name: "Dr. Iyer", label: "OPD C • Cardiology" },
] as const;

const doctorById: Record<(typeof doctors)[number]["id"], (typeof doctors)[number]> = doctors.reduce(
  (acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  },
  {} as Record<(typeof doctors)[number]["id"], (typeof doctors)[number]>
);

const patients: Patient[] = [
  { id: "P004", risk: 92, timeToRisk: "15 min", timeMinutes: 15, urgency: "high", ttrLevel: "critical", condition: "Post-op Cardiac", waitTime: "10m" },
  { id: "P001", risk: 85, timeToRisk: "30 min", timeMinutes: 30, urgency: "high", ttrLevel: "critical", condition: "Sepsis Watch", waitTime: "25m" },
  { id: "P007", risk: 68, timeToRisk: "45 min", timeMinutes: 45, urgency: "medium", ttrLevel: "watch", condition: "Respiratory Distress", waitTime: "15m" },
  { id: "P002", risk: 45, timeToRisk: "2 hours", timeMinutes: 120, urgency: "medium", ttrLevel: "watch", condition: "Observation", waitTime: "45m" },
  { id: "P005", risk: 30, timeToRisk: "3 hours", timeMinutes: 180, urgency: "low", ttrLevel: "safe", condition: "Routine Check", waitTime: "5m" },
  { id: "P003", risk: 12, timeToRisk: "6 hours", timeMinutes: 360, urgency: "low", ttrLevel: "safe", condition: "Stable", waitTime: "1h 10m" },
  { id: "P006", risk: 8, timeToRisk: "8 hours", timeMinutes: 480, urgency: "low", ttrLevel: "safe", condition: "Discharge Ready", waitTime: "2h" },
];

// Original FIFO order (arrival order)
const originalOrder: Patient[] = [
  patients[4], // P005
  patients[5], // P003
  patients[3], // P002
  patients[6], // P006
  patients[0], // P004
  patients[2], // P007
  patients[1], // P001
];

function QueueTable({
  data,
  loading,
  assignments,
  onAssign,
  onOpenProfile,
  onReorder,
  reorderable = false,
}: {
  data: Patient[];
  loading: boolean;
  assignments: Record<string, (typeof doctors)[number]["id"] | undefined>;
  onAssign: (patientId: string, doctorId: (typeof doctors)[number]["id"]) => void;
  onOpenProfile: (patientId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  reorderable?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-[#e1d8c7] overflow-hidden bg-[#fdfbf6]/95 backdrop-blur-xl shadow-xl shadow-black/15 ring-1 ring-[#e1d8c7]/80">
      <Table>
        <TableHeader className="bg-[#f1ede2]/90 backdrop-blur-md">
          <TableRow className="hover:bg-transparent border-[#e1d8c7]">
            <TableHead className="w-16 font-bold text-[#7a7e9a] pl-6 uppercase tracking-[0.16em] text-[11px] h-12">#</TableHead>
            <TableHead className="font-bold text-[#7a7e9a] uppercase tracking-[0.16em] text-[11px]">Patient ID</TableHead>
            <TableHead className="font-bold text-[#7a7e9a] uppercase tracking-[0.16em] text-[11px]">Condition</TableHead>
            <TableHead className="font-bold text-[#7a7e9a] uppercase tracking-[0.16em] text-[11px]">Risk Analysis</TableHead>
            <TableHead className="font-bold text-[#7a7e9a] uppercase tracking-[0.16em] text-[11px]">Time-to-Risk</TableHead>
            <TableHead className="font-bold text-[#7a7e9a] uppercase tracking-[0.16em] text-[11px]">Wait Time</TableHead>
            <TableHead className="text-right font-bold text-[#7a7e9a] pr-6 uppercase tracking-[0.16em] text-[11px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-[#f1ede2]">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-6 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            : data.map((p, idx) => {
                const assignedId = assignments[p.id];
                const assigned = assignedId ? doctorById[assignedId] : undefined;
                return (
                <TableRow
                  key={p.id}
                  className="group border-[#f1ede2] hover:bg-[#fffaf2] transition-all duration-300 cursor-pointer"
                  draggable={reorderable}
                  onDragStart={
                    reorderable && onReorder
                      ? (event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", String(idx));
                        }
                      : undefined
                  }
                  onDragOver={
                    reorderable && onReorder
                      ? (event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }
                      : undefined
                  }
                  onDrop={
                    reorderable && onReorder
                      ? (event) => {
                          event.preventDefault();
                          const fromIndexString = event.dataTransfer.getData("text/plain");
                          const fromIndex = Number(fromIndexString);
                          if (!Number.isNaN(fromIndex) && fromIndex !== idx) {
                            onReorder(fromIndex, idx);
                          }
                        }
                      : undefined
                  }
                >
                  <TableCell className="font-mono text-xs text-[#9ca3c7] pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => onOpenProfile(p.id)}
                  >
                    <div className="flex flex-col">
                       <span className="font-bold text-[#111322] group-hover:text-[#3a3e61] transition-colors">{p.id}</span>
                       <span className="text-[10px] text-[#7a7e9a] uppercase tracking-[0.18em] font-semibold">
                         {assigned ? assigned.name : "Unassigned"}
                       </span>
                       {assigned && (
                         <span className="text-[10px] text-[#9ca3c7]">
                           {assigned.label}
                         </span>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#4b4f70] font-medium group-hover:text-[#111322] transition-colors">{p.condition}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                         <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-[#f1ede2]"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                            <path
                              className={`${p.risk > 80 ? 'text-rose-500 drop-shadow-sm' : p.risk > 50 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                              strokeDasharray={`${p.risk}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              strokeLinecap="round"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                         </svg>
                         <span className={`absolute text-[10px] font-bold ${p.risk > 80 ? 'text-rose-600' : p.risk > 50 ? 'text-amber-600' : 'text-[#3a3e61]'}`}>
                           {p.risk}%
                         </span>
                      </div>
                      <div className="flex flex-col">
                        <RiskBadge level={p.urgency} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TimeToRiskBadge time={p.timeToRisk} level={p.ttrLevel} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[#fdfbf6] bg-[#3a3e61] px-2.5 py-1.5 rounded-full w-fit border border-[#111322]/40 shadow-sm shadow-[#111322]/30">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold tracking-wide">{p.waitTime}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#7a7e9a] hover:text-[#111322] hover:bg-[#f1ede2] rounded-full transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl shadow-black/10 border border-[#e1d8c7] bg-[#fdfbf6]">
                        <DropdownMenuItem
                          className="text-[#111322] font-medium cursor-pointer rounded-lg focus:bg-[#f1ede2] focus:text-[#3a3e61]"
                          onClick={() => onOpenProfile(p.id)}
                        >
                           <ArrowUpRight className="mr-2 h-4 w-4" /> View Patient Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[11px] font-semibold text-[#7a7e9a] tracking-[0.16em] uppercase px-2">
                          Assign doctor
                        </DropdownMenuLabel>
                        {doctors.map((doc) => (
                          <DropdownMenuItem
                            key={doc.id}
                            className="text-[#111322] text-xs font-medium cursor-pointer rounded-lg focus:bg-[#f1ede2] flex items-center gap-2"
                            onClick={() => onAssign(p.id, doc.id)}
                          >
                            <span>{doc.name}</span>
                            <span className="ml-auto text-[10px] text-[#9ca3c7]">{doc.label}</span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600 font-medium focus:text-rose-700 focus:bg-rose-50 rounded-lg cursor-pointer">
                          Mark as Critical
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
        </TableBody>
      </Table>
    </div>
  );
}

export default function OPDQueue() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, (typeof doctors)[number]["id"] | undefined>>({});
  const [aiQueue, setAiQueue] = useState<Patient[]>(() => patients);
  const { data: appointments, isLoading: appointmentsLoading } = useApiQuery<Appointment[]>(
    ["appointments"],
    "/appointments"
  );
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAssignDoctor = (patientId: string, doctorId: (typeof doctors)[number]["id"]) => {
    setAssignments((prev) => ({
      ...prev,
      [patientId]: doctorId,
    }));
  };

  const handleOpenProfile = (patientId: string) => {
    navigate(`/post-op?patient=${encodeURIComponent(patientId)}`);
  };

  const handleReorderAiQueue = (fromIndex: number, toIndex: number) => {
    setAiQueue((previous) => {
      const updated = [...previous];
      if (
        fromIndex < 0 ||
        fromIndex >= updated.length ||
        toIndex < 0 ||
        toIndex >= updated.length
      ) {
        return previous;
      }
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const primaryDoctor = doctors[0];

  const appointmentQueue: Patient[] = (appointments ?? [])
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.appointment_time).getTime();
      const tb = new Date(b.appointment_time).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta - tb;
    })
    .map((appointment) => {
      const base = patients.find((p) => p.id === appointment.patient_id);
      const appointmentDate = new Date(appointment.appointment_time);
      const now = new Date();
      const diffMs = appointmentDate.getTime() - now.getTime();
      let waitLabel = "Now";

      if (!Number.isNaN(diffMs)) {
        const diffMinutes = Math.round(diffMs / 60000);
        if (diffMinutes > 60) {
          const hours = Math.floor(diffMinutes / 60);
          const minutes = diffMinutes % 60;
          waitLabel = minutes ? `${hours}h ${minutes}m` : `${hours}h`;
        } else if (diffMinutes > 0) {
          waitLabel = `${diffMinutes}m`;
        } else {
          waitLabel = "Due";
        }
      }

      return {
        id: appointment.patient_id,
        risk: base?.risk ?? 0,
        timeToRisk: base?.timeToRisk ?? "",
        timeMinutes: base?.timeMinutes ?? 0,
        urgency: base?.urgency ?? "low",
        ttrLevel: base?.ttrLevel ?? "safe",
        condition: base?.condition ?? "Booked appointment",
        waitTime: waitLabel,
      };
    });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fdfbf6]">
              OPD CareQueue
            </h2>
            <p className="text-sm sm:text-base text-[#f1ede2]/85 max-w-xl">
              Clean, AI-prioritized outpatient queue ranked by Time-to-Risk for the ward.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-[#fdfbf6]/10 border border-[#fdfbf6]/30 rounded-2xl px-4 py-2 text-xs text-[#f1ede2] shadow-lg shadow-black/20">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fdfbf6]/90 text-[#3a3e61]">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-[0.18em] uppercase text-[10px]">
                  {primaryDoctor.name}
                </span>
                <span className="text-[11px] text-[#f1ede2]/80">
                  {primaryDoctor.label}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 rounded-full border-[#fdfbf6]/40 bg-[#fdfbf6]/10 text-[#fdfbf6] hover:bg-[#fdfbf6] hover:text-[#111322] shadow-sm hover:shadow-md transition-colors"
            >
              <Filter className="mr-1 h-4 w-4" /> Filter
            </Button>
            <div className="flex items-center gap-2 bg-[#fdfbf6] px-3 py-1.5 rounded-full border border-[#111322]/20 shadow-sm shadow-black/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-[#111322] tracking-wide">
                Live updates active
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden border border-[#e1d8c7] shadow-xl shadow-black/15 bg-[#fdfbf6]/95 rounded-3xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users className="h-32 w-32 text-[#3a3e61] transform translate-x-8 -translate-y-8" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#3a3e61] shadow-sm ring-1 ring-[#111322] rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-[#fdfbf6]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#7a7e9a] uppercase tracking-[0.18em]">
                    Total patients
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-black text-[#111322]">24</p>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" /> +12%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-[#e1d8c7] shadow-xl shadow-black/15 bg-[#fdfbf6]/95 rounded-3xl transition-all duration-300 group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Zap className="h-32 w-32 text-[#f97373] transform translate-x-8 -translate-y-8" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#f97373] shadow-sm ring-1 ring-[#111322] rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-[#111322]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#7a1f1f]/80 uppercase tracking-[0.18em]">
                    Critical attention
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-3xl font-black text-[#b91c1c]">3</p>
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      Immediate Action
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-[#e1d8c7] shadow-xl shadow-black/15 bg-[#fdfbf6]/95 rounded-3xl transition-all duration-300 group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Clock className="h-32 w-32 text-emerald-600 transform translate-x-8 -translate-y-8" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white shadow-sm ring-1 ring-emerald-100 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#7a7e9a] uppercase tracking-[0.18em]">
                    Avg wait time
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                     <p className="text-3xl font-black text-[#111322]">12m</p>
                     <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> -5%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#fdfbf6]/20 pb-4">
            <TabsList className="bg-[#111322]/40 p-1 border border-[#fdfbf6]/25 rounded-xl h-12 shadow-sm self-start backdrop-blur">
              <TabsTrigger
                value="ai"
                className="rounded-lg data-[state=active]:bg-[#fdfbf6] data-[state=active]:text-[#111322] px-4 text-xs font-semibold tracking-wide text-[#fdfbf6]/90 transition-all"
              >
                <Zap className="h-4 w-4 mr-2 text-[#f97373]" />
                AI-prioritized queue
              </TabsTrigger>
              <TabsTrigger
                value="original"
                className="rounded-lg data-[state=active]:bg-[#fdfbf6] data-[state=active]:text-[#111322] px-4 text-xs font-semibold tracking-wide text-[#fdfbf6]/90 transition-all"
              >
                <Clock className="h-4 w-4 mr-2 text-[#fdfbf6]/80" />
                Standard FIFO
              </TabsTrigger>
                <TabsTrigger
                  value="appointments"
                  className="rounded-lg data-[state=active]:bg-[#fdfbf6] data-[state=active]:text-[#111322] px-4 text-xs font-semibold tracking-wide text-[#fdfbf6]/90 transition-all"
                >
                  <CalendarDays className="h-4 w-4 mr-2 text-[#fdfbf6]/80" />
                  Booked slots
                </TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex text-xs font-medium text-[#f1ede2]/85 bg-[#ffffff]/10 px-3 py-1.5 rounded-full border border-[#fdfbf6]/30 backdrop-blur">
               <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
               Auto-refreshing (30s)
            </div>
          </div>

          <TabsContent value="ai" className="mt-0 focus-visible:outline-none">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-sm sm:text-base font-semibold text-[#fdfbf6] flex items-center gap-3 tracking-[0.16em] uppercase">
                     Sorted by Time-to-Risk
                     <span className="inline-flex items-center rounded-full bg-[#fdfbf6] px-2.5 py-1 text-[10px] font-semibold text-[#111322] ring-1 ring-[#111322]/10">
                       Recommended
                     </span>
                   </CardTitle>
                   <Button
                     variant="ghost"
                     size="sm"
                     className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#fdfbf6] hover:text-[#111322] hover:bg-[#fdfbf6] rounded-full px-3 py-1 border border-[#fdfbf6]/30"
                   >
                      View Full Analysis <ArrowUpRight className="ml-1 h-3 w-3" />
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <QueueTable
                  data={aiQueue}
                  loading={loading}
                  assignments={assignments}
                  onAssign={handleAssignDoctor}
                  onOpenProfile={handleOpenProfile}
                  reorderable
                  onReorder={handleReorderAiQueue}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="original" className="mt-0 focus-visible:outline-none">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-sm sm:text-base font-semibold text-[#fdfbf6] tracking-[0.16em] uppercase">
                  Arrival Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <QueueTable
                  data={originalOrder}
                  loading={loading}
                  assignments={assignments}
                  onAssign={handleAssignDoctor}
                  onOpenProfile={handleOpenProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-0 focus-visible:outline-none">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0 pb-4">
                <CardTitle className="text-sm sm:text-base font-semibold text-[#fdfbf6] tracking-[0.16em] uppercase">
                  Appointments from patient app
                </CardTitle>
                <CardDescription className="text-xs text-[#f1ede2]/80">
                  Slots booked by patients, ordered by chosen appointment time.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <QueueTable
                  data={appointmentQueue}
                  loading={loading || appointmentsLoading}
                  assignments={assignments}
                  onAssign={handleAssignDoctor}
                  onOpenProfile={handleOpenProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
