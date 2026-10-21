import { getProviderStyle } from "@/lib/utils";

export function BreakdownList({
  items,
  total,
  emptyLabel = "No data yet",
}: {
  items: Array<{ key: string; label: string; count: number }>;
  total: number;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {emptyLabel}
      </p>
    );
  }

  const safeTotal = Math.max(total, 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const percentage = Math.round((item.count / safeTotal) * 100);
        const style = getProviderStyle(item.key);

        return (
          <li key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${style.chip}`}
                >
                  <style.icon className="h-3 w-3" />
                </span>
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {item.count}
                <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                  {percentage}%
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-800 to-slate-600 transition-all dark:from-slate-100 dark:to-slate-400"
                style={{ width: `${Math.max(percentage, 2)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
