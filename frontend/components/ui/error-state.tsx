import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
  compact = false,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[28px] border border-rose-200/70 bg-rose-50/70 px-6 text-center dark:border-rose-500/25 dark:bg-rose-950/30",
        compact ? "py-6" : "min-h-[220px] py-10",
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-rose-900 dark:text-rose-100">
          {title}
        </h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm leading-6 text-rose-700/90 dark:text-rose-200/80">
            {description}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
