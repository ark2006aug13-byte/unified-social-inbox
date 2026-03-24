"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SettingsPanel() {
  const { session, login, logout, loading } = useSession();

  if (loading) {
    return <Card className="min-h-[320px] animate-pulse" />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
            <UserRound className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Account
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Profile and access
            </h3>
          </div>
        </div>

        {session?.authenticated ? (
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Name:</span>{" "}
              {session.user?.name}
            </p>
            <p>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Email:</span>{" "}
              {session.user?.email}
            </p>
            <Button variant="secondary" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>Sign in to manage connected accounts and workspace preferences.</p>
            <Button onClick={login}>Login with Google</Button>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
            <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Security
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Runtime configuration
            </h3>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
          <p>Frontend API base URL: {API_BASE_URL}</p>
          <p>Provider tokens are stored on the backend and encrypted before persistence.</p>
          <p>Google OAuth is handled server-side and the frontend relies on an httpOnly session cookie.</p>
        </div>
      </Card>
    </div>
  );
}
