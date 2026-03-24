"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, MailOpen, Sparkles } from "lucide-react";
import { gmailApi, integrationApi, messageApi } from "@/lib/api";
import type { Integration, Message } from "@/lib/types";
import { formatDate, formatProvider } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/metric-card";

export function DashboardOverview() {
  const { session, loading, login } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!session?.authenticated) {
      return;
    }

    try {
      const [messageResponse, integrationResponse] = await Promise.all([
        messageApi.list(),
        integrationApi.list(),
      ]);
      setMessages(messageResponse.messages);
      setIntegrations(integrationResponse.integrations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    }
  }, [session?.authenticated]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const gmailConnected = integrations.find((item) => item.key === "gmail")?.connected;

    return [
      {
        label: "Messages indexed",
        value: messages.length.toString(),
        description: "Searchable across the unified inbox.",
      },
      {
        label: "AI-categorized",
        value: messages.filter((message) => Boolean(message.aiCategory)).length.toString(),
        description: "Messages enriched by summaries and categories.",
      },
      {
        label: "Gmail status",
        value: gmailConnected ? "Connected" : "Pending",
        description: gmailConnected ? "Your inbox can be synced on demand." : "Connect Gmail to begin importing messages.",
      },
    ];
  }, [integrations, messages]);

  if (loading) {
    return <Card className="min-h-[320px] animate-pulse" />;
  }

  if (!session?.authenticated) {
    return (
      <Card className="space-y-4">
        <Badge>Secure access</Badge>
        <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Sign in with Google to unlock your dashboard
        </h3>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
          Authentication, connected accounts, Gmail sync, AI summaries, and live updates are all protected behind the backend session.
        </p>
        <Button onClick={login}>Login with Google</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Recent activity
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                Latest messages
              </h3>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                void gmailApi.sync().then(() => {
                  void loadDashboard();
                })
              }
            >
              Sync Gmail
            </Button>
          </div>

          <div className="space-y-3">
            {messages.slice(0, 5).map((message) => (
              <div
                key={message.id}
                className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950 dark:text-slate-50">{message.sender}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {formatProvider(message.provider)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {message.subject || message.snippet}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Workspace health
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              What is ready right now
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
              <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium text-slate-950 dark:text-slate-100">Google authentication</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Secure login with server-issued cookies and provider token storage.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl bg-sky-50 p-4 dark:bg-sky-950/40">
              <MailOpen className="mt-1 h-5 w-5 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="font-medium text-slate-950 dark:text-slate-100">Gmail-first ingestion</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Messages can be synced into PostgreSQL and surfaced in the unified inbox.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-3xl bg-violet-50 p-4 dark:bg-violet-950/40">
              <Sparkles className="mt-1 h-5 w-5 text-violet-600 dark:text-violet-400" />
              <div>
                <p className="font-medium text-slate-950 dark:text-slate-100">OpenAI workflows</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Summaries, categories, and reply suggestions are generated on demand.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
              {error}
            </p>
          ) : (
            <a
              href="/integrations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              Review integration settings
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </Card>
      </div>
    </div>
  );
}
