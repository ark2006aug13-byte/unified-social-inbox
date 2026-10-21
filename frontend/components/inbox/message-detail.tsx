"use client";

import { useState } from "react";
import { Check, Copy, Mail, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/lib/types";
import {
  cn,
  formatCategory,
  formatDate,
  getProviderStyle,
} from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

export function MessageDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/60 bg-white/70 p-6 dark:border-slate-800/80 dark:bg-slate-950/70">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-5 h-6 w-3/4" />
        <Skeleton className="mt-3 h-3.5 w-48" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20 w-full rounded-[22px]" />
          <Skeleton className="h-16 w-2/3 rounded-[22px]" />
        </div>
      </div>
      <Skeleton className="h-72 w-full rounded-[28px]" />
    </div>
  );
}

export function MessageDetail({
  message,
  loading = false,
}: {
  message: Message | null;
  loading?: boolean;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <MessageDetailSkeleton />;
  }

  if (!message) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-slate-300 bg-white/40 px-6 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Select a conversation
        </h3>
        <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          Pick a message on the left to read the full thread, see the AI summary
          and draft a reply.
        </p>
      </div>
    );
  }

  const style = getProviderStyle(message.provider);

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(message.body || "");
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error("Could not copy", "Your browser blocked clipboard access.");
    }
  };

  const conversation =
    message.conversation && message.conversation.length > 0
      ? message.conversation
      : [
          {
            id: `${message.id}-incoming`,
            sender: message.sender,
            body: message.body,
            timestamp: message.timestamp,
            direction: "inbound" as const,
          },
        ];

  return (
    <div className="rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-halo backdrop-blur sm:p-6 dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
              style.chip,
            )}
          >
            <style.icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-xl dark:text-slate-50">
                {message.subject || "(No subject)"}
              </h2>
              {message.aiCategory ? (
                <Badge tone="success" plain>
                  {formatCategory(message.aiCategory)}
                </Badge>
              ) : null}
              {!message.isRead ? <Badge tone="info" plain>Unread</Badge> : null}
            </div>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {message.sender} · {formatDate(message.timestamp)}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => void copyBody()}>
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {message.aiSummary ? (
        <div className="mt-5 rounded-[22px] border border-violet-200/70 bg-violet-50/70 p-4 dark:border-violet-500/25 dark:bg-violet-950/30">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              AI summary
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
            {message.aiSummary}
          </p>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {conversation.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "max-w-[92%] rounded-[22px] border px-4 py-3",
              entry.direction === "outbound"
                ? "ml-auto border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-slate-100"
                : "border-slate-200/70 bg-slate-50/70 text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {entry.sender}
              </p>
              <p className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
                {formatDate(entry.timestamp)}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
              {entry.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
