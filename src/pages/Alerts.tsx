import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, Pill, HeartPulse, Info, CheckCircle2, Filter, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlertSeverity = "critical" | "warning" | "info";

interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  icon: React.ElementType;
  patientId?: string;
}

const alerts: Alert[] = [
  {
    id: "A001",
    severity: "critical",
    message: "Patient P004 likely to deteriorate within 30 minutes",
    timestamp: "Just now",
    icon: AlertTriangle,
    patientId: "P-004"
  },
  {
    id: "A002",
    severity: "critical",
    message: "Medication dose is critical – immediate action required",
    timestamp: "5 min ago",
    icon: Pill,
    patientId: "P-004"
  },
  {
    id: "A006",
    severity: "critical",
    message: "Patient P001 heart rate elevated to 110 bpm – review required",
    timestamp: "12 min ago",
    icon: HeartPulse,
    patientId: "P-001"
  },
  {
    id: "A003",
    severity: "warning",
    message: "Patient P007 SpO₂ dropping below 94% – monitor closely",
    timestamp: "18 min ago",
    icon: HeartPulse,
    patientId: "P-007"
  },
  {
    id: "A004",
    severity: "warning",
    message: "Patient P002 Time-to-Risk reduced to 2 hours",
    timestamp: "25 min ago",
    icon: Clock,
    patientId: "P-002"
  },
  {
    id: "A005",
    severity: "info",
    message: "Patient P003 recovery progressing normally – low risk",
    timestamp: "1 hr ago",
    icon: Info,
    patientId: "P-003"
  },
];

const severityStyles: Record<AlertSeverity, string> = {
  critical: "border-l-rose-500 bg-rose-50/50 hover:bg-rose-50",
  warning: "border-l-amber-500 bg-amber-50/50 hover:bg-amber-50",
  info: "border-l-blue-500 bg-blue-50/50 hover:bg-blue-50",
};

const iconStyles: Record<AlertSeverity, string> = {
  critical: "text-rose-600 bg-rose-100",
  warning: "text-amber-600 bg-amber-100",
  info: "text-blue-600 bg-blue-100",
};

export default function Alerts() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Alerts</h2>
            <p className="text-sm text-slate-500">Real-time risk notifications and system events</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search alerts..." className="pl-9 w-64 bg-white" />
             </div>
             <Button variant="outline" className="gap-2">
               <Filter className="h-4 w-4" /> Filter
             </Button>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700">Live Feed</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pb-2 overflow-x-auto">
          {["all", "critical", "warning", "info"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
                filter === f 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" 
                  : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="shadow-sm border-slate-100">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : alerts
                .filter(a => filter === "all" || a.severity === filter)
                .map((alert, idx) => (
                <Card
                  key={alert.id}
                  className={cn(
                    "border-0 border-l-4 shadow-sm transition-all duration-300 hover:shadow-md hover:translate-x-1",
                    severityStyles[alert.severity],
                    "animate-in fade-in slide-in-from-bottom-2"
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={cn("mt-0.5 p-2 rounded-full shrink-0", iconStyles[alert.severity])}>
                      <alert.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                         <h4 className="text-sm font-bold text-slate-900 truncate">
                           {alert.severity === 'critical' ? 'Critical Alert' : alert.severity === 'warning' ? 'Warning' : 'Information'}
                           <span className="mx-2 text-slate-300 font-normal">|</span>
                           <span className="text-slate-600 font-medium">{alert.patientId}</span>
                         </h4>
                         <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0">
                           <Clock className="h-3 w-3" /> {alert.timestamp}
                         </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{alert.message}</p>
                      
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white/50 border-slate-200 hover:bg-white">View Patient</Button>
                        {alert.severity === 'critical' && (
                           <Button size="sm" className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-sm shadow-rose-600/20">Acknowledge</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
