"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Inbox,
  Layers,
  LogIn,
  MailOpen,
  RefreshCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { dashboardApi, gmailApi, integrationApi, messageApi, ApiError } from "@/lib/api";
import type { DashboardResponse, Integration, Message } from "@/lib/types";
import {
  cn,
  formatCategory,
  formatRelativeTime,
  getProviderStyle,
} from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { MetricCard } from "@/components/dashboard/metric-card";

export function DashboardOverview() {
  const { session, loading: sessionLoading, login } = useSession();
  const toast = useToast();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [recent, setRecent] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!session?.authenticated) {
      return;
    }

    setLoading(true);

    try {
      const [statsResponse, integrationResponse, messageResponse] =
        await Promise.all([
          dashboardApi.stats(),
          integrationApi.list(),
          messageApi.list({ limit: 8 }),
        ]);

      setData(statsResponse);
      setIntegrations(integrationResponse.integrations ?? []);
      setRecent(messageResponse.messages ?? []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, [session?.authenticated]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSync = async () => {
    setSyncing(true);

    try {
      const response = await gmailApi.sync(25);
      await loadDashboard();
      toast.success(
        "Gmail synced",
        `${response.synced} new message${response.synced === 1 ? "" : "s"} imported.`,
      );
    } catch (err) {
      toast.error(
        "Sync failed",
        err instanceof ApiError ? err.message : "Gmail could not be reached.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const providerBreakdown = useMemo(
    () =>
      (data?.byProvider ?? []).map((entry) => ({
        key: entry.provider,
        label: getProviderStyle(entry.provider).label,
        count: entry.count,
      })),
    [data?.byProvider],
  );

  const categoryBreakdown = useMemo(
    () =>
      (data?.byCategory ?? []).map((entry) => ({
        key: entry.category,
        label: formatCategory(entry.category),
        count: entry.count,
      })),
    [data?.byCategory],
  );

  const gmailIntegration = integrations.find((item) => item.key === "gmail");
  const connectedCount = integrations.filter((item) => item.connected).length;

  if (sessionLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[168px] animate-pulse rounded-[26px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70"
          />
        ))}
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
            Secure access
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
            Sign in with Google to unlock your dashboard
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Authentication, connected accounts, Gmail sync and AI summaries are
            all protected behind the backend session.
          </p>
        </div>
        <Button onClick={login} size="lg">
          Continue with Google
        </Button>
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        description={error}
        onRetry={() => void loadDashboard()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[168px] animate-pulse rounded-[26px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70"
            />
          ))
        ) : (
          <>
            <MetricCard
              label="Conversations"
              value={data?.stats.total ?? 0}
              description="Indexed across every connected channel."
              icon={Inbox}
              tone="sky"
            />
            <MetricCard
              label="Unread"
              value={data?.stats.unread ?? 0}
              description="Messages still waiting for a first look."
              icon={MailOpen}
              tone="amber"
            />
            <MetricCard
              label="AI categorised"
              value={data?.stats.categorized ?? 0}
              description="Classified by the assistant for fast triage."
              icon={Sparkles}
              tone="violet"
            />
            <MetricCard
              label="Channels live"
              value={`${connectedCount}/${integrations.length}`}
              description={
                gmailIntegration?.connected
                  ? "Gmail is connected and syncing."
                  : "Connect Gmail to start importing messages."
              }
              icon={Layers}
              tone="emerald"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="space-y-5">
          <CardHeader
            title="Conversation volume"
            description="Messages received over the last seven days."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleSync()}
                loading={syncing}
              >
                {!syncing ? <RefreshCcw className="h-3.5 w-3.5" /> : null}
                {syncing ? "Syncing" : "Sync"}
              </Button>
            }
          />

          {loading && !data ? (
            <div className="flex h-44 items-end gap-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="flex-1 rounded-t-xl" />
              ))}
            </div>
          ) : (
            <ActivityChart activity={data?.activity ?? []} />
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="space-y-4">
            <CardHeader
              title="By channel"
              description="Where the conversations are coming from."
            />
            <BreakdownList
              items={providerBreakdown}
              total={data?.stats.total ?? 0}
              emptyLabel="Connect a channel to see the split."
            />
          </Card>

          <Card className="space-y-4">
            <CardHeader
              title="By category"
              description="How the assistant classified your inbox."
            />
            <BreakdownList
              items={categoryBreakdown}
              total={data?.stats.total ?? 0}
              emptyLabel="Generate a summary to categorise messages."
            />
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="space-y-4">
          <CardHeader
            title="Latest conversations"
            description="The most recent activity across your channels."
            action={
              <Link
                href="/inbox"
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                Open inbox
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            }
          />

          {loading && recent.length === 0 ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-[20px]" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="Nothing here yet"
              description="Sync Gmail to pull your latest conversations into the dashboard."
              action={{ label: "Sync Gmail", onClick: () => void handleSync() }}
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((message) => {
                const style = getProviderStyle(message.provider);

                return (
                  <li key={message.id}>
                    <Link
                      href="/inbox"
                      className="flex items-start gap-3 rounded-[20px] border border-slate-200/70 bg-white/60 p-3.5 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                          style.chip,
                        )}
                      >
                        <style.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {message.sender}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                            {formatRelativeTime(message.timestamp)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-slate-700 dark:text-slate-200">
                          {message.subject || message.snippet}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge plain>{style.label}</Badge>
                          {message.aiCategory ? (
                            <Badge tone="success" plain>
                              {formatCategory(message.aiCategory)}
                            </Badge>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <CardHeader
            title="Workspace readiness"
            description="What is working right now."
          />

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 rounded-[20px] bg-emerald-50 p-3.5 dark:bg-emerald-950/30">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Google authentication
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Server-issued cookies with encrypted provider token storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[20px] bg-sky-50 p-3.5 dark:bg-sky-950/30">
              <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Gmail ingestion
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {gmailIntegration?.connected
                    ? "Connected. Messages sync into the unified inbox on demand."
                    : "Not connected yet. Connect Gmail to start importing messages."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[20px] bg-violet-50 p-3.5 dark:bg-violet-950/30">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  AI workflows
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {data?.stats.summarized
                    ? `${data.stats.summarized} message${data.stats.summarized === 1 ? "" : "s"} summarised and classified.`
                    : "Summaries, categories and reply drafts are generated on demand."}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            Review integration settings
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
