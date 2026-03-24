"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, Sparkles } from "lucide-react";
import { aiApi, gmailApi, messageApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Message, ReplyOption, SummaryResponse } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageDetail } from "@/components/inbox/message-detail";
import { InboxLayout } from "@/components/inbox/inbox-layout";
import { MessageList } from "@/components/inbox/message-list";

const categories = ["all", "brand_deal", "support", "sales", "operations"];
const providers = ["all", "gmail", "instagram", "whatsapp", "facebook", "twitter"];

export function InboxWorkspace({
  title,
  subtitle,
  lockedProvider,
}: {
  title: string;
  subtitle: string;
  lockedProvider?: string;
}) {
  const { session, loading, login } = useSession();
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
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gmailConnected = useMemo(
    () =>
      Boolean(
        session?.connectedAccounts?.some((account) => account.provider.toLowerCase() === "gmail"),
      ),
    [session?.connectedAccounts],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setProvider(lockedProvider || "all");
  }, [lockedProvider]);

  const fetchMessages = useCallback(async () => {
    if (!session?.authenticated) {
      return;
    }

    setLoadingMessages(true);
    try {
      const response = await messageApi.list({
        q: search,
        provider: lockedProvider || (provider === "all" ? undefined : provider),
        category: category === "all" ? undefined : category,
      });
      setMessages(response.messages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inbox messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, [session?.authenticated, search, lockedProvider, provider, category]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!messages.length) {
      setSelectedId(null);
      setSelectedMessage(null);
      return;
    }

    if (!selectedId || !messages.find((message) => message.id === selectedId)) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  useEffect(() => {
    if (!selectedId || !session?.authenticated) {
      return;
    }

    void messageApi
      .get(selectedId)
      .then((response) => {
        setSelectedMessage(response.message);
        setSummary(
          response.message.aiSummary
            ? {
                summary: response.message.aiSummary,
                category: response.message.aiCategory || "other",
                urgency: "medium",
                actionItems: [],
              }
            : null,
        );
        setReplies([]);
        setReplyDraft("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load message detail.");
      });
  }, [selectedId, session?.authenticated]);

  useEffect(() => {
    if (!session?.authenticated) {
      return;
    }

    const socket = getSocket();
    const handleRefresh = () => {
      void fetchMessages();
    };

    socket.on("messages:updated", handleRefresh);
    return () => {
      socket.off("messages:updated", handleRefresh);
    };
  }, [session?.authenticated, fetchMessages]);

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
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize the message.");
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
        message: selectedMessage.body || selectedMessage.snippet || "",
        tone,
      });
      setReplies(response.suggestions || []);
      setReplyDraft(response.reply || response.suggestions?.[0]?.body || "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate reply suggestions.");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await gmailApi.sync();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync Gmail.");
    }
  };

  if (loading) {
    return <Card className="min-h-[420px] animate-pulse" />;
  }

  if (!session?.authenticated) {
    return (
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Authentication required
        </p>
        <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Sign in before opening the inbox
        </h3>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
          Gmail connection, message sync, AI summaries, and live updates are all tied to the secure backend session.
        </p>
        <Button onClick={login}>Login with Google</Button>
      </Card>
    );
  }

  if (lockedProvider === "gmail" && !gmailConnected) {
    return (
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Gmail required
        </p>
        <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Connect Gmail to start importing messages
        </h3>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
          The Gmail integration requests read-only access, stores encrypted provider tokens, and syncs messages into PostgreSQL for the unified inbox.
        </p>
        <Button onClick={() => gmailApi.connect()}>Connect Gmail</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {lockedProvider ? "Provider view" : "Unified inbox"}
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search sender, subject, or body"
                className="w-64 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </div>
            <Button variant="secondary" className="gap-2" onClick={handleSync}>
              <RefreshCcw className="h-4 w-4" />
              Sync Gmail
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!lockedProvider
            ? providers.map((item) => (
                <button
                  key={item}
                  onClick={() => setProvider(item)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    provider === item
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {item === "all" ? "All platforms" : item}
                </button>
              ))
            : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === item
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {item === "all" ? "All categories" : item}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}
      </Card>

      {!messages.length && !loadingMessages ? (
        <div className="space-y-4">
          <EmptyState
            title="No messages yet"
            description="Connect Gmail and run a sync to start populating the unified inbox."
          />
          {!gmailConnected ? (
            <div className="flex justify-center">
              <Button onClick={() => gmailApi.connect()}>Connect Gmail</Button>
            </div>
          ) : null}
        </div>
      ) : (
        <InboxLayout
          list={
            <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Message list
                </p>
                <h4 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                  {loadingMessages ? "Refreshing..." : `${messages.length} conversation${messages.length === 1 ? "" : "s"}`}
                </h4>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                Live
              </div>
            </div>
            <MessageList messages={messages} selectedId={selectedId} onSelect={setSelectedId} />
            </>
          }
          preview={
            <MessageDetail
              message={selectedMessage}
              summary={summary}
              replies={replies}
              replyDraft={replyDraft}
              summaryLoading={summaryLoading}
              replyLoading={replyLoading}
              tone={tone}
              onReplyDraftChange={setReplyDraft}
              onToneChange={setTone}
              onSummarize={handleSummary}
              onReply={handleReply}
            />
          }
        />
      )}
    </div>
  );
}
