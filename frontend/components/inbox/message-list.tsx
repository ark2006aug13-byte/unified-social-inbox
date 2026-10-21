"use client";

import { MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/lib/types";
import {
  cn,
  formatCategory,
  formatRelativeTime,
  getProviderStyle,
  truncate,
} from "@/lib/utils";

export function MessageListSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[22px] border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="mt-3 h-3.5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
}: {
  messages: Message[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<MailOpen className="h-6 w-6" />}
        title="No conversations match"
        description="Try a different search term, channel or category."
        minHeight="200px"
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {messages.map((message) => {
        const style = getProviderStyle(message.provider);
        const Icon = style.icon;
        const isSelected = selectedId === message.id;
        const unread = !message.isRead;

        return (
          <li key={message.id}>
            <button
              type="button"
              onClick={() => onSelect(message.id)}
              aria-current={isSelected}
              className={cn(
                "group w-full rounded-[22px] border p-4 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                isSelected
                  ? "border-slate-950 bg-slate-950 text-white shadow-lift dark:border-white dark:bg-white dark:text-slate-950"
                  : "border-slate-200/70 bg-white/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                      isSelected
                        ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-950"
                        : style.chip,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        unread ? "font-semibold" : "font-medium",
                        isSelected
                          ? "text-white dark:text-slate-950"
                          : "text-slate-900 dark:text-slate-100",
                      )}
                    >
                      {message.sender}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-[11px] uppercase tracking-[0.14em]",
                        isSelected
                          ? "text-white/60 dark:text-slate-500"
                          : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {style.label}
                    </span>
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {unread ? (
                    <span
                      aria-label="Unread"
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isSelected ? "bg-sky-400" : "bg-sky-500",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "whitespace-nowrap text-[11px]",
                      isSelected
                        ? "text-white/60 dark:text-slate-500"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {formatRelativeTime(message.timestamp)}
                  </span>
                </div>
              </div>

              <p
                className={cn(
                  "mt-3 truncate text-sm",
                  unread ? "font-semibold" : "font-medium",
                  isSelected
                    ? "text-white dark:text-slate-950"
                    : "text-slate-900 dark:text-slate-100",
                )}
              >
                {message.subject || "(No subject)"}
              </p>

              <p
                className={cn(
                  "mt-1.5 line-clamp-2 text-xs leading-5",
                  isSelected
                    ? "text-white/70 dark:text-slate-600"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {truncate(message.snippet || message.body || "", 150)}
              </p>

              {message.aiCategory || unread ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {message.aiCategory ? (
                    <Badge
                      plain
                      className={
                        isSelected
                          ? "bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-950"
                          : undefined
                      }
                    >
                      {formatCategory(message.aiCategory)}
                    </Badge>
                  ) : null}
                  {unread ? (
                    <Badge
                      plain
                      tone={isSelected ? undefined : "info"}
                      className={
                        isSelected
                          ? "bg-sky-400/20 text-sky-100 dark:bg-sky-900/20 dark:text-sky-700"
                          : undefined
                      }
                    >
                      Unread
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
