import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        {actions ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px] lg:max-w-md">
            {actions}
          </div>
        ) : null}
      </div>

      {children}
    </Card>
  );
}
