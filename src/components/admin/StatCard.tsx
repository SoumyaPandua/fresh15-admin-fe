import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export function StatCard({
  label, value, delta, icon: Icon, hint, tone = "default",
}: {
  label: string; value: string; delta?: number; icon?: LucideIcon; hint?: string;
  tone?: "default" | "success" | "warning" | "info" | "danger";
}) {
  const toneClass = {
    default: "bg-muted text-foreground",
    success: "bg-primary/10 text-primary",
    warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    info: "bg-[color:var(--info)]/12 text-[color:var(--info)]",
    danger: "bg-destructive/12 text-destructive",
  }[tone];

  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5 gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div className={cn("grid h-9 w-9 place-items-center rounded-xl", toneClass)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="number text-[28px] font-semibold leading-none tracking-tight">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        {typeof delta === "number" && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
            up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
