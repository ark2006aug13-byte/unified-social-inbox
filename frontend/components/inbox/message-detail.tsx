import { MessagePreview } from "@/components/inbox/message-preview";
import type { Message, ReplyOption, SummaryResponse } from "@/lib/types";

export function MessageDetail({
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
  return (
    <MessagePreview
      message={message}
      summary={summary}
      replies={replies}
      replyDraft={replyDraft}
      summaryLoading={summaryLoading}
      replyLoading={replyLoading}
      tone={tone}
      onReplyDraftChange={onReplyDraftChange}
      onToneChange={onToneChange}
      onSummarize={onSummarize}
      onReply={onReply}
    />
  );
}
