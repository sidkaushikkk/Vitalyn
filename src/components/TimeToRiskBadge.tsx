import { cn } from "@/lib/utils";

interface TimeToRiskBadgeProps {
  time: string;
  level: "safe" | "watch" | "critical";
  className?: string;
}

const styles: Record<string, string> = {
  safe: "border-risk-safe/30 bg-risk-safe-bg text-risk-safe",
  watch: "border-risk-watch/30 bg-risk-watch-bg text-risk-watch",
  critical: "border-risk-critical/30 bg-risk-critical-bg text-risk-critical",
};

export function TimeToRiskBadge({ time, level, className }: TimeToRiskBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold",
        styles[level],
        level === "critical" && "animate-pulse-soft",
        className
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {time}
    </div>
  );
}
