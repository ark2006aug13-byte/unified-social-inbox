import { Badge } from "@/components/ui/badge";
import type { Message } from "@/lib/types";
import { cn, formatDate, formatProvider } from "@/lib/utils";

export function MessageList({
  messages,
  selectedId,
  onSelect,
}: {
  messages: Message[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <button
          key={message.id}
          onClick={() => onSelect(message.id)}
          className={cn(
            "w-full rounded-[26px] border p-4 text-left transition",
            selectedId === message.id
              ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
              : "border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{message.sender}</p>
              <p
                className={cn(
                  "mt-1 text-xs uppercase tracking-[0.18em]",
                  selectedId === message.id
                    ? "text-white/70 dark:text-slate-500"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {formatProvider(message.provider)}
              </p>
            </div>
            <span
              className={cn(
                "text-xs",
                selectedId === message.id
                  ? "text-white/70 dark:text-slate-500"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {formatDate(message.timestamp)}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium">{message.subject || "(No subject)"}</p>
          <p
            className={cn(
              "mt-2 line-clamp-3 text-sm leading-7",
              selectedId === message.id
                ? "text-white/80 dark:text-slate-600"
                : "text-slate-600 dark:text-slate-400",
            )}
          >
            {message.snippet || message.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {message.aiCategory ? <Badge>{message.aiCategory}</Badge> : null}
            {!message.isRead ? <Badge tone="warning">Unread</Badge> : null}
          </div>
        </button>
      ))}
    </div>
  );
}
