"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inbox, LogIn, RefreshCcw, WifiOff } from "lucide-react";
import { aiApi, gmailApi, messageApi, ApiError } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Message, ReplyOption, SummaryResponse } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { AiCopilot } from "@/components/inbox/ai-copilot";
import { InboxFilters, SearchField } from "@/components/inbox/inbox-filters";
import { MessageList, MessageListSkeleton } from "@/components/inbox/message-list";
import { MessageDetail, MessageDetailSkeleton } from "@/components/inbox/message-detail";

function normalizeUrgency(value?: string | null): "low" | "medium" | "high" {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

export function InboxWorkspace({
  title,
  subtitle,
  lockedProvider,
}: {
  title: string;
  subtitle: string;
  lockedProvider?: string;
}) {
  const { session, loading: sessionLoading, login, refresh } = useSession();
  const toast = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState(lockedProvider || "all");
  const [tone, setTone] = useState("professional");

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const searchTimeout = useRef<number | null>(null);

  const gmailConnected = useMemo(
    () =>
      Boolean(
        session?.connectedAccounts?.some(
          (account) => account.provider.toLowerCase() === "gmail",
        ),
      ),
    [session?.connectedAccounts],
  );

  // Debounce the search so typing does not fire a request per keystroke.
  useEffect(() => {
    if (searchTimeout.current) {
      window.clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = window.setTimeout(() => setSearch(searchInput), 300);

    return () => {
      if (searchTimeout.current) {
        window.clearTimeout(searchTimeout.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    setProvider(lockedProvider || "all");
  }, [lockedProvider]);

  const fetchMessages = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!session?.authenticated) {
        return;
      }

      if (!options.silent) {
        setLoadingMessages(true);
      }

      try {
        const response = await messageApi.list({
          q: search || undefined,
          provider:
            lockedProvider || (provider === "all" ? undefined : provider),
          category: category === "all" ? undefined : category,
        });

        setMessages(response.messages ?? []);
        setListError(null);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Could not load conversations.";

        setListError(message);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [session?.authenticated, search, lockedProvider, provider, category],
  );

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // Keep the selected conversation valid when the list changes.
  useEffect(() => {
    if (messages.length === 0) {
      setSelectedId(null);
      setSelectedMessage(null);
      return;
    }

    if (!selectedId || !messages.some((message) => message.id === selectedId)) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  // Load the full conversation for the selected message.
  useEffect(() => {
    if (!selectedId || !session?.authenticated) {
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    setDetailError(null);

    messageApi
      .get(selectedId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSelectedMessage(response.message);
        setSummary(
          response.message.aiSummary
            ? {
                summary: response.message.aiSummary,
                category: response.message.aiCategory || "other",
                urgency: normalizeUrgency(response.message.urgency),
                actionItems: [],
                persisted: true,
              }
            : null,
        );
        setReplies([]);
        setReplyDraft("");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSelectedMessage(null);
        setDetailError(
          error instanceof ApiError ? error.message : "Could not load this message.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, session?.authenticated]);

  // Live updates. The backend only emits for explicit syncs, so this cannot
  // feed back into another request.
  useEffect(() => {
    if (!session?.authenticated) {
      return;
    }

    const socket = getSocket();

    const handleRefresh = () => {
      void fetchMessages({ silent: true });
    };

    socket.on("messages:updated", handleRefresh);

    return () => {
      socket.off("messages:updated", handleRefresh);
    };
  }, [session?.authenticated, fetchMessages]);

  // Keyboard navigation between conversations.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key !== "j" && event.key !== "k") {
        return;
      }

      if (messages.length === 0) {
        return;
      }

      event.preventDefault();
      const currentIndex = messages.findIndex(
        (message) => message.id === selectedId,
      );
      const delta = event.key === "j" ? 1 : -1;
      const nextIndex = Math.min(
        Math.max(currentIndex + delta, 0),
        messages.length - 1,
      );

      const next = messages[nextIndex];
      if (next) {
        setSelectedId(next.id);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [messages, selectedId]);

  const handleSummary = async () => {
    if (!selectedMessage) {
      return;
    }

    setSummaryLoading(true);

    try {
      const response = await aiApi.summary({
        messageId: selectedMessage.id,
        message: selectedMessage.body || selectedMessage.snippet || "",
        provider: selectedMessage.provider,
        sender: selectedMessage.sender,
        subject: selectedMessage.subject || undefined,
      });

      setSummary(response);
      toast.success(
        "Summary generated",
        response.persisted
          ? "The classification was saved for this message."
          : "Generated for this preview. Connect Gmail to store it.",
      );
      void fetchMessages({ silent: true });
    } catch (error) {
      toast.error(
        "Could not generate a summary",
        error instanceof ApiError ? error.message : "Please try again in a moment.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage) {
      return;
    }

    setReplyLoading(true);

    try {
      const response = await aiApi.reply({
        messageId: selectedMessage.id,
        message: selectedMessage.body || selectedMessage.snippet || "",
        tone,
      });

      const suggestions = response.suggestions ?? [];

      setReplies(suggestions);
      setReplyDraft(response.reply || suggestions[0]?.body || "");
      toast.success("Drafts ready", `${suggestions.length} options generated.`);
    } catch (error) {
      toast.error(
        "Could not draft a reply",
        error instanceof ApiError ? error.message : "Please try again in a moment.",
      );
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);

    try {
      const response = await gmailApi.sync(25);
      await fetchMessages({ silent: true });
      toast.success(
        "Gmail synced",
        `${response.synced} new message${response.synced === 1 ? "" : "s"} imported.`,
      );
    } catch (error) {
      toast.error(
        "Sync failed",
        error instanceof ApiError
          ? error.message
          : "Gmail could not be reached. Try reconnecting the account.",
      );
    } finally {
      setSyncing(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)_380px]">
        <Card className="h-[520px] animate-pulse" />
        <Card className="h-[520px] animate-pulse" />
        <Card className="h-[520px] animate-pulse" />
      </div>
    );
  }

  if (!session?.authenticated) {
    return (
      <Card className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <LogIn className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Authentication required
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
            Sign in to open your unified inbox
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Gmail sync, AI summaries and live updates are all tied to your
            secure backend session.
          </p>
        </div>
        <Button onClick={login} size="lg">
          Continue with Google
        </Button>
      </Card>
    );
  }

  if (lockedProvider === "gmail" && !gmailConnected) {
    return (
      <Card className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
          <WifiOff className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Gmail required
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
            Connect Gmail to import messages
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            The Gmail integration requests read-only access, encrypts the
            provider tokens and syncs messages into the unified inbox.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => gmailApi.connect()} size="lg">
            Connect Gmail
          </Button>
          <Button variant="secondary" onClick={() => void refresh()}>
            Refresh connection state
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={lockedProvider ? "Provider view" : "Unified inbox"}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <SearchField value={searchInput} onChange={setSearchInput} />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleSync()}
                loading={syncing}
                className="flex-1"
              >
                {!syncing ? <RefreshCcw className="h-3.5 w-3.5" /> : null}
                {syncing ? "Syncing..." : "Sync Gmail"}
              </Button>
              <span className="hidden text-[11px] text-slate-400 dark:text-slate-500 sm:inline">
                Press{" "}
                <kbd className="rounded border border-slate-300 px-1 font-mono dark:border-slate-700">
                  j
                </kbd>
                /
                <kbd className="rounded border border-slate-300 px-1 font-mono dark:border-slate-700">
                  k
                </kbd>{" "}
                to move
              </span>
            </div>
          </>
        }
      >
        <InboxFilters
          provider={provider}
          category={category}
          onProviderChange={setProvider}
          onCategoryChange={setCategory}
          lockedProvider={lockedProvider}
          resultCount={messages.length}
        />
      </PageHeader>

      {listError ? (
        <ErrorState
          title="Could not load the inbox"
          description={listError}
          onRetry={() => void fetchMessages()}
        />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)_minmax(340px,400px)]">
          <Card
            flush
            className="max-h-[calc(100vh-16rem)] overflow-hidden p-4 xl:sticky xl:top-5"
          >
            <div className="overflow-y-auto pr-1">
              {loadingMessages && messages.length === 0 ? (
                <MessageListSkeleton />
              ) : (
                <MessageList
                  messages={messages}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </Card>

          <div className="min-w-0 space-y-4">
            {detailError ? (
              <ErrorState
                title="Could not load this conversation"
                description={detailError}
                onRetry={() => setSelectedId((current) => current)}
                retryLabel="Reload message"
              />
            ) : (
              <MessageDetail
                message={selectedMessage}
                loading={loadingDetail && !selectedMessage}
              />
            )}

            {messages.length === 0 && !loadingMessages ? (
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title="No conversations yet"
                description={
                  gmailConnected
                    ? "Run a sync to pull your latest Gmail messages into the unified inbox."
                    : "Connect Gmail and run a sync to start populating the unified inbox."
                }
                action={
                  gmailConnected
                    ? { label: "Sync Gmail", onClick: () => void handleSync() }
                    : { label: "Connect Gmail", onClick: () => gmailApi.connect() }
                }
              />
            ) : null}
          </div>

          <div className="min-w-0 xl:sticky xl:top-5">
            <AiCopilot
              message={selectedMessage}
              summary={summary}
              replies={replies}
              replyDraft={replyDraft}
              summaryLoading={summaryLoading}
              replyLoading={replyLoading}
              tone={tone}
              onToneChange={setTone}
              onReplyDraftChange={setReplyDraft}
              onSummarize={() => void handleSummary()}
              onReply={() => void handleReply()}
              disabled={!selectedMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
