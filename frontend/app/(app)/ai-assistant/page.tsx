"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Copy, Send, Sparkles, Wand2 } from "lucide-react";
import { aiApi, ApiError } from "@/lib/api";
import type { ReplyOption, SummaryResponse } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

const EXAMPLES = [
  "Hi team - just checking in on the launch timeline for the spring campaign.",
  "Thanks for your message! Could you share the latest performance report?",
  "We are excited to partner with you. When works best to schedule a call next week?",
];

export default function AiAssistantPage() {
  const { session, loading } = useSession();
  const toast = useToast();

  const [input, setInput] = useState(EXAMPLES[0]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [busy, setBusy] = useState<"summary" | "reply" | null>(null);

  const run = useCallback(
    async (mode: "summary" | "reply") => {
      const value = input.trim();

      if (!value) {
        toast.warning("Nothing to work with", "Paste a message first.");
        return;
      }

      setBusy(mode);

      try {
        if (mode === "summary") {
          const response = await aiApi.summary({ message: value });
          setSummary(response);
          setReplies([]);
          toast.success("Summary ready");
        } else {
          const response = await aiApi.reply({ message: value });
          setReplies(response.suggestions ?? []);
          if (response.reply) {
            setReplies((current) =>
              current.length > 0
                ? current
                : [{ title: "Suggested reply", body: response.reply as string }],
            );
          }
          toast.success("Drafts ready");
        }
      } catch (error) {
        toast.error(
          mode === "summary" ? "Could not summarise" : "Could not draft replies",
          error instanceof ApiError ? error.message : "Please try again.",
        );
      } finally {
        setBusy(null);
      }
    },
    [input, toast],
  );

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="h-[420px] animate-pulse rounded-[28px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70" />
        <div className="h-[420px] animate-pulse rounded-[28px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Assistant"
        title="Summaries and reply drafts"
        subtitle="Paste any message to classify it, pull out action items and generate reply options you can send straight away."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="space-y-5">
        <CardHeader
          title="Try the assistant"
          description="Paste any message to classify it or generate reply options."
          action={
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
          }
        />

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste a message here…"
          className="min-h-[220px] w-full resize-y rounded-[22px] border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setInput(example)}
              className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void run("summary")}
            loading={busy === "summary"}
            disabled={busy !== null}
          >
            {!busy ? <Wand2 className="h-4 w-4" /> : null}
            Summarise &amp; classify
          </Button>
          <Button
            variant="secondary"
            onClick={() => void run("reply")}
            loading={busy === "reply"}
            disabled={busy !== null}
          >
            {!busy ? <Bot className="h-4 w-4" /> : null}
            Draft replies
          </Button>
        </div>
      </Card>

      <Card className="space-y-5">
        <CardHeader
          title="Output"
          description="Results stream back as soon as the model responds."
        />

        {!summary && replies.length === 0 ? (
          <EmptyState
            icon={<Bot className="h-6 w-6" />}
            title="Nothing generated yet"
            description="Run a summary or a draft on the left to see the assistant output here."
          />
        ) : null}

        {summary ? (
          <div className="space-y-3">
            <div className="rounded-[22px] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
              <p className="text-sm leading-6">{summary.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge
                  plain
                  className="bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-950"
                >
                  {summary.category}
                </Badge>
                <Badge
                  plain
                  className="bg-white/15 text-white dark:bg-slate-900/10 dark:text-slate-950"
                >
                  {summary.urgency} urgency
                </Badge>
              </div>
            </div>

            {summary.actionItems?.length ? (
              <div className="rounded-[22px] border border-slate-200/70 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Action items
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {summary.actionItems.map((item, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200"
                    >
                      <span aria-hidden>•</span>
                      <span className="min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {replies.length > 0 ? (
          <div className="space-y-2.5">
            {replies.map((reply) => (
              <div
                key={reply.title}
                className="rounded-[22px] border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {reply.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(reply.body)
                        .then(() => toast.success("Copied"))
                        .catch(() => toast.error("Could not copy"));
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {reply.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {session && !session.authenticated ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The AI assistant works without signing in, but summaries are only
            stored on your account when you are signed in.
          </p>
        ) : null}
        </Card>
      </div>
    </div>
  );
}
