"use client";

import {
  Database,
  KeyRound,
  LogIn,
  LogOut,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/components/providers/toast-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 py-2.5 last:border-0 dark:border-slate-800/70">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={
          mono
            ? "break-all text-right font-mono text-xs text-slate-700 dark:text-slate-300"
            : "break-all text-right text-sm font-medium text-slate-900 dark:text-slate-100"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function SettingsPanel() {
  const { session, login, logout, loading } = useSession();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out", "Your session has been cleared.");
    } catch (_error) {
      toast.error("Sign out failed", "Please try again in a moment.");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-[320px] animate-pulse rounded-[28px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70" />
        <div className="h-[320px] animate-pulse rounded-[28px] border border-white/60 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Workspace"
        title="Account and runtime"
        subtitle="Your identity, connected providers and the configuration this browser is using to reach the API."
        actions={
          session?.authenticated ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleLogout()}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-5">
          <CardHeader
            title="Account"
            description="Your identity and connected providers."
            action={
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <UserRound className="h-5 w-5" />
              </span>
            }
          />

          {session?.authenticated ? (
            <>
              <div className="flex items-center gap-3.5 rounded-[22px] border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <Avatar
                  name={session.user?.name}
                  src={session.user?.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    {session.user?.name || "Google User"}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {session.user?.email}
                  </p>
                </div>
              </div>

              <div>
                <DetailRow label="User id" value={session.user?.id || "—"} mono />
                <DetailRow
                  label="Member since"
                  value={
                    session.user?.createdAt
                      ? new Date(session.user.createdAt).toLocaleDateString()
                      : "—"
                  }
                />
                <DetailRow
                  label="Connected providers"
                  value={String(session.connectedAccounts?.length ?? 0)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                Sign in to manage connected accounts and workspace preferences.
              </p>
              <Button onClick={login} size="lg">
                <LogIn className="h-4 w-4" />
                Continue with Google
              </Button>
            </div>
          )}
        </Card>

      <div className="space-y-4">
        <Card className="space-y-5">
          <CardHeader
            title="Runtime configuration"
            description="How this browser is talking to the API."
            action={
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
            }
          />

          <div>
            <DetailRow label="API base URL" value={API_BASE_URL} mono />
            <DetailRow
              label="Authentication"
              value="httpOnly cookie + Bearer token"
            />
            <DetailRow label="Token storage" value="AES-256-GCM, server side" />
            <DetailRow label="Live updates" value="Socket.IO over WebSocket" />
          </div>
        </Card>

        <Card className="space-y-4">
          <CardHeader
            title="Data & privacy"
            description="What leaves your infrastructure."
          />

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 rounded-[20px] bg-sky-50 p-3.5 dark:bg-sky-950/30">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Provider tokens stay on the server
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  OAuth tokens are encrypted before they are written to the
                  database and are never sent to the browser.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[20px] bg-violet-50 p-3.5 dark:bg-violet-950/30">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  AI requests are explicit
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Message content is only sent to the AI provider when you ask
                  for a summary or a draft.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[20px] bg-amber-50 p-3.5 dark:bg-amber-950/25">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  PostgreSQL persistence
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  Messages, labels and AI metadata are stored per account. The
                  backend falls back to an in-memory mode when no database is
                  configured.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge tone="success" plain>
              Session cookies are httpOnly
            </Badge>
            <Badge tone="info" plain>
              CORS locked to the frontend origin
            </Badge>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
