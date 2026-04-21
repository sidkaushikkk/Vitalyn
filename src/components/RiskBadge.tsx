import { cn } from "@/lib/utils";

type RiskLevel = "low" | "medium" | "high";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const config: Record<RiskLevel, { label: string; classes: string }> = {
  low: { label: "Low", classes: "bg-risk-safe-bg text-risk-safe" },
  medium: { label: "Medium", classes: "bg-risk-watch-bg text-risk-watch" },
  high: { label: "High", classes: "bg-risk-critical-bg text-risk-critical" },
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const { label, classes } = config[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        classes,
        level === "high" && "animate-pulse-soft",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
