"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, PlugZap } from "lucide-react";
import { gmailApi, integrationApi } from "@/lib/api";
import type { Integration } from "@/lib/types";
import { useSession } from "@/hooks/use-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function IntegrationsGrid() {
  const { session, loading, login } = useSession();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.authenticated) {
      return;
    }

    void integrationApi
      .list()
      .then((response) => {
        setIntegrations(response.integrations);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load integrations.");
      });
  }, [session?.authenticated]);

  if (loading) {
    return <Card className="min-h-[320px] animate-pulse" />;
  }

  if (!session?.authenticated) {
    return (
      <Card className="space-y-4">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          Sign in to manage connected platforms
        </h3>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
          Integration state is tied to your account and surfaced from the backend registry.
        </p>
        <Button onClick={login}>Login with Google</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="text-sm text-rose-600 dark:text-rose-300">{error}</Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.key} className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Provider
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                  {integration.name}
                </h3>
              </div>
              {integration.connected ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : integration.status === "coming_soon" ? (
                <Clock3 className="h-5 w-5 text-amber-500" />
              ) : (
                <PlugZap className="h-5 w-5 text-sky-500" />
              )}
            </div>

            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
              {integration.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {integration.connected ? (
                <Badge tone="success">Connected</Badge>
              ) : integration.status === "coming_soon" ? (
                <Badge tone="warning">Coming soon</Badge>
              ) : (
                <Badge>Ready to connect</Badge>
              )}
            </div>

            {integration.key === "gmail" ? (
              <Button onClick={() => gmailApi.connect()}>
                {integration.connected ? "Reconnect Gmail" : "Connect Gmail"}
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Planned integration
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
