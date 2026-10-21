"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  PlugZap,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { gmailApi, integrationApi, ApiError } from "@/lib/api";
import type { Integration } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate, getProviderStyle } from "@/lib/utils";

export function IntegrationsGrid() {
  const { session, loading: sessionLoading, login } = useSession();
  const toast = useToast();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.authenticated) {
      return;
    }

    setLoading(true);

    try {
      const response = await integrationApi.list();
      setIntegrations(response.integrations ?? []);
      setDemoMode(Boolean(response.demoMode));
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load your integrations.",
      );
    } finally {
      setLoading(false);
    }
  }, [session?.authenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  if (sessionLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[240px] animate-pulse rounded-[28px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70"
          />
        ))}
      </div>
    );
  }

  if (!session?.authenticated) {
    return (
      <Card className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <PlugZap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Connected platforms
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
            Sign in to manage your channels
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Integration state is tied to your account and surfaced from the
            backend registry.
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
        title="Could not load your integrations"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {demoMode ? (
        <div className="flex items-start gap-3 rounded-[24px] border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-950/25">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Demo mode is on
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800/90 dark:text-amber-200/80">
              Conversations for the channels that are not implemented yet are
              served as sample data. Set <code>DEMO_MODE=false</code> to hide
              them.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && integrations.length === 0
          ? Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="space-y-4">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
            ))
          : integrations.map((integration) => {
              const style = getProviderStyle(integration.key);
              const Icon = style.icon;
              const isGmail = integration.key === "gmail";

              return (
                <Card
                  key={integration.key}
                  className={cn(
                    "flex h-full flex-col gap-4 transition",
                    integration.connected &&
                      "ring-1 ring-emerald-300/60 dark:ring-emerald-500/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                        style.chip,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    {integration.connected ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : integration.status === "coming_soon" ? (
                      <Clock3 className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                      <PlugZap className="h-5 w-5 shrink-0 text-sky-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                      {integration.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {integration.description}
                    </p>

                    {integration.connected && integration.connectedAt ? (
                      <p className="mt-2.5 text-xs text-slate-400 dark:text-slate-500">
                        Connected {formatDate(integration.connectedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {integration.connected ? (
                      <Badge tone="success">Connected</Badge>
                    ) : integration.status === "coming_soon" ? (
                      <Badge tone="warning">Coming soon</Badge>
                    ) : (
                      <Badge tone="info">Ready to connect</Badge>
                    )}
                  </div>

                  {isGmail ? (
                    <Button
                      onClick={() => gmailApi.connect()}
                      className="w-full"
                      variant={integration.connected ? "secondary" : "primary"}
                    >
                      {!integration.connected ? (
                        <PlugZap className="h-4 w-4" />
                      ) : (
                        <RefreshCcw className="h-4 w-4" />
                      )}
                      {integration.connected ? "Reconnect Gmail" : "Connect Gmail"}
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled className="w-full">
                      Planned integration
                    </Button>
                  )}
                </Card>
              );
            })}
      </div>

      {integrations.length === 0 && !loading ? (
        <Card className="py-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No integrations are available yet.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => {
              toast.info("Registry empty", "The backend returned no providers.");
            }}
          >
            Refresh
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
