import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Message, ReplyOption, SummaryResponse } from "@/lib/types";
import { formatDate, formatProvider } from "@/lib/utils";

export function MessagePreview({
  message,
  summary,
  replies,
  replyDraft,
  summaryLoading,
  replyLoading,
  tone,
  onReplyDraftChange,
  onToneChange,
  onSummarize,
  onReply,
}: {
  message: Message | null;
  summary: SummaryResponse | null;
  replies: ReplyOption[];
  replyDraft: string;
  summaryLoading: boolean;
  replyLoading: boolean;
  tone: string;
  onReplyDraftChange: (value: string) => void;
  onToneChange: (tone: string) => void;
  onSummarize: () => void;
  onReply: () => void;
}) {
  if (!message) {
    return (
      <Card className="flex min-h-[420px] items-center justify-center text-center">
        <div className="max-w-md space-y-3">
          <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
            Select a message to inspect it
          </h3>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
            The preview panel shows the full body, labels, AI summary, and smart reply suggestions.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{formatProvider(message.provider)}</Badge>
          {message.aiCategory ? <Badge tone="success">{message.aiCategory}</Badge> : null}
          {!message.isRead ? <Badge tone="warning">Unread</Badge> : null}
        </div>
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            {message.subject || "(No subject)"}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {message.sender} - {formatDate(message.timestamp)}
          </p>
        </div>
        <div className="space-y-3">
          {(message.conversation?.length ? message.conversation : [
            {
              id: `${message.id}-incoming`,
              sender: message.sender,
              body: message.body,
              timestamp: message.timestamp,
              direction: "inbound" as const,
            },
          ]).map((entry) => (
            <div
              key={entry.id}
              className={`max-w-[92%] rounded-[24px] border px-4 py-3 ${
                entry.direction === "outbound"
                  ? "ml-auto border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-slate-100"
                  : "border-slate-200/70 bg-slate-50/70 text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {entry.sender}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-inherit">
                {entry.body}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              AI Assistant
            </p>
            <h4 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Summaries and smart replies
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSummarize} disabled={summaryLoading}>
              {summaryLoading ? "Generating summary..." : "Generate summary"}
            </Button>
            <select
              value={tone}
              onChange={(event) => onToneChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="confident">Confident</option>
            </select>
            <Button onClick={onReply} disabled={replyLoading}>
              {replyLoading ? "Generating reply..." : "AI Reply"}
            </Button>
          </div>
        </div>

        {summary ? (
          <div className="rounded-[26px] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">Summary</p>
            </div>
            <p className="mt-4 text-sm leading-7">{summary.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/15 text-white dark:bg-slate-100 dark:text-slate-900">
                {summary.category}
              </Badge>
              <Badge className="bg-white/15 text-white dark:bg-slate-100 dark:text-slate-900">
                {summary.urgency} urgency
              </Badge>
            </div>
            {summary.actionItems.length ? (
              <ul className="mt-4 space-y-2 text-sm text-white/85 dark:text-slate-700">
                {summary.actionItems.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 p-5 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No AI summary yet. Generate one to classify urgency and pull out action items.
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-950 dark:text-slate-100">Reply draft</p>
              <Badge>Autofill ready</Badge>
            </div>
            <textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              placeholder="Click AI Reply to draft a response."
              className="mt-3 min-h-[160px] w-full resize-none rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 outline-none focus:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-sky-700"
            />
          </div>

          {replies.length ? (
            replies.map((reply) => (
              <div
                key={reply.title}
                className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <p className="font-medium text-slate-950 dark:text-slate-100">{reply.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {reply.body}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 p-5 text-sm leading-7 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No reply suggestions yet. Generate three tailored options from the assistant.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
