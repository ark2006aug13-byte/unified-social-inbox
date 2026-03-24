import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <div className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </div>
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
    </Card>
  );
}
