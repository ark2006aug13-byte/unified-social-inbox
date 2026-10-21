"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ListChecks,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, ReplyOption, SummaryResponse } from "@/lib/types";
import { cn, formatCategory } from "@/lib/utils";
import { useToast } from "@/components/providers/toast-provider";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "confident", label: "Confident" },
];

const URGENCY_TONE: Record<string, "default" | "warning" | "danger"> = {
  low: "default",
  medium: "warning",
  high: "danger",
};

export function AiCopilot({
  message,
  summary,
  replies,
  replyDraft,
  summaryLoading,
  replyLoading,
  tone,
  onToneChange,
  onReplyDraftChange,
  onSummarize,
  onReply,
  disabled = false,
}: {
  message: Message | null;
  summary: SummaryResponse | null;
  replies: ReplyOption[];
  replyDraft: string;
  summaryLoading: boolean;
  replyLoading: boolean;
  tone: string;
  onToneChange: (tone: string) => void;
  onReplyDraftChange: (value: string) => void;
  onSummarize: () => void;
  onReply: () => void;
  disabled?: boolean;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copyDraft = async () => {
    if (!replyDraft) {
      return;
    }

    try {
      await navigator.clipboard.writeText(replyDraft);
      setCopied(true);
      toast.success("Draft copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error("Could not copy", "Your browser blocked clipboard access.");
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-halo backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              AI Copilot
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Summary and drafts
            </p>
          </div>
        </div>
        {summary?.persisted ? (
          <Badge tone="success" plain>
            Saved
          </Badge>
        ) : null}
      </div>

      {!message ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
          <Wand2 className="h-5 w-5 text-slate-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Pick a conversation
          </p>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            The assistant summarises, classifies and drafts a reply for the
            message you select.
          </p>
        </div>
      ) : (
        <>
          <Button
            onClick={onSummarize}
            loading={summaryLoading}
            disabled={disabled}
            className="w-full"
          >
            {!summaryLoading ? <Sparkles className="h-4 w-4" /> : null}
            {summaryLoading
              ? "Generating summary..."
              : summary
                ? "Refresh summary"
                : "Generate summary"}
          </Button>

          {summaryLoading ? (
            <div className="space-y-2.5 rounded-[22px] bg-slate-100/70 p-4 dark:bg-slate-900/60">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : summary ? (
            <div className="space-y-3 rounded-[22px] bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
              <p className="text-sm leading-6">{summary.summary}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  plain
                  className="bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-950"
                >
                  {formatCategory(summary.category)}
                </Badge>
                <Badge
                  plain
                  tone={URGENCY_TONE[summary.urgency] ?? "default"}
                  className="bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-950"
                >
                  {summary.urgency} urgency
                </Badge>
              </div>
              {summary.actionItems?.length ? (
                <div className="border-t border-white/10 pt-3 dark:border-slate-900/10">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 dark:text-slate-500">
                    <ListChecks className="h-3.5 w-3.5" />
                    Action items
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {summary.actionItems.map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-xs leading-5 text-white/85 dark:text-slate-700"
                      >
                        <span aria-hidden>•</span>
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-[22px] border border-dashed border-slate-300 px-4 py-5 text-center text-xs leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No summary yet. Generate one to classify urgency and pull out
              action items.
            </p>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Reply options
              </p>
              <div className="flex items-center gap-1.5">
                {TONES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onToneChange(option.value)}
                    aria-pressed={tone === option.value}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] font-semibold transition",
                      tone === option.value
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={onReply}
              loading={replyLoading}
              disabled={disabled}
              className="w-full"
            >
              {!replyLoading ? <Zap className="h-4 w-4" /> : null}
              {replyLoading ? "Drafting..." : "Draft replies"}
            </Button>

            {replies.length > 0 ? (
              <div className="space-y-2">
                {replies.map((reply) => (
                  <button
                    key={reply.title}
                    type="button"
                    onClick={() => onReplyDraftChange(reply.body)}
                    className={cn(
                      "w-full rounded-[20px] border border-slate-200/70 bg-white/80 p-3 text-left transition hover:border-slate-300 hover:bg-white",
                      "dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900",
                    )}
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {reply.title}
                    </p>
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
                      {reply.body}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Your draft
                </p>
                <button
                  type="button"
                  onClick={() => void copyDraft()}
                  disabled={!replyDraft}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-200/70 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <textarea
                value={replyDraft}
                onChange={(event) => onReplyDraftChange(event.target.value)}
                placeholder="Generate a draft, or write your own reply here."
                className="min-h-[150px] w-full resize-y rounded-[18px] border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
