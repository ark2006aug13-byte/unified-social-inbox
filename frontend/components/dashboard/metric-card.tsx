import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "default",
  footer,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  tone?: "default" | "sky" | "emerald" | "violet" | "amber";
  footer?: React.ReactNode;
}) {
  const tones = {
    default:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  };

  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-white/60 bg-white/70 p-5 shadow-lift backdrop-blur transition hover:shadow-halo dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105",
              tones[tone],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50">
        {value}
      </p>

      {description ? (
        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </p>
      ) : null}

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
