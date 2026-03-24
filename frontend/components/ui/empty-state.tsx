import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-3xl bg-slate-100 p-4 dark:bg-slate-900">
        <Inbox className="h-7 w-7 text-slate-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Card>
  );
}
