import type { ActivityPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActivityChart({
  activity,
}: {
  activity: ActivityPoint[];
}) {
  const max = Math.max(
    1,
    ...activity.map((point) => Math.max(point.total, point.unread)),
  );

  if (activity.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="flex h-44 items-end gap-2 sm:gap-3">
      {activity.map((point) => {
        const totalHeight = Math.round((point.total / max) * 100);
        const unreadHeight = Math.round((point.unread / max) * 100);

        return (
          <div
            key={point.date}
            className="group flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="relative flex h-full w-full items-end justify-center">
              <div
                className="w-full max-w-[46px] rounded-t-xl bg-slate-200/80 transition-all group-hover:bg-slate-300/80 dark:bg-slate-800 dark:group-hover:bg-slate-700"
                style={{ height: `${Math.max(totalHeight, 3)}%` }}
              >
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-sky-500 to-sky-400 transition-all dark:from-sky-600 dark:to-sky-500"
                  style={{ height: `${totalHeight ? (unreadHeight / totalHeight) * 100 : 0}%` }}
                />
              </div>

              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100 dark:bg-white dark:text-slate-950">
                {point.total} message{point.total === 1 ? "" : "s"}
                {point.unread > 0 ? ` · ${point.unread} unread` : ""}
              </div>
            </div>

            <span
              className={cn(
                "truncate text-[11px] font-medium",
                "text-slate-500 dark:text-slate-400",
              )}
            >
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
