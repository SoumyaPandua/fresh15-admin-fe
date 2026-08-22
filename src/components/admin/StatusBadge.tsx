import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "info" | "danger" | "neutral" | "primary";
const map: Record<Tone, string> = {
  success: "bg-primary/10 text-primary ring-primary/20",
  warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-[color:var(--warning)]/25",
  info: "bg-[color:var(--info)]/12 text-[color:var(--info)] ring-[color:var(--info)]/25",
  danger: "bg-destructive/12 text-destructive ring-destructive/25",
  neutral: "bg-muted text-muted-foreground ring-border",
  primary: "bg-primary text-primary-foreground ring-primary",
};

export function StatusBadge({ label, tone = "neutral", dot = true }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", map[tone])}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full",
        tone === "success" ? "bg-primary" :
        tone === "warning" ? "bg-[color:var(--warning)]" :
        tone === "info" ? "bg-[color:var(--info)]" :
        tone === "danger" ? "bg-destructive" :
        tone === "primary" ? "bg-primary-foreground" : "bg-muted-foreground"
      )} />}
      {label}
    </span>
  );
}

export function orderStatusTone(s: string): Tone {
  return s === "pending" ? "warning" : s === "live" ? "info" : s === "completed" ? "success" : s === "cancelled" ? "danger" : "neutral";
}
export function payStatusTone(s: string): Tone {
  return s === "paid" ? "success" : s === "pending" ? "warning" : "danger";
}
