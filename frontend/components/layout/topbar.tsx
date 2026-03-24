"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSession } from "@/hooks/use-session";

export function Topbar() {
  const { session, logout, login, loading } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  const showAuthenticatedActions =
    mounted && !loading && session?.authenticated;

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-halo backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          SaaS Dashboard
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          Manage every conversation from one place
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <Bell className="h-4 w-4" />
          Live updates ready
        </div>
        <ThemeToggle />
        {showAuthenticatedActions ? (
          <Button variant="secondary" className="gap-2" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        ) : mounted && !loading ? (
          <Button onClick={login}>Login with Google</Button>
        ) : (
          <Button variant="secondary" disabled>
            Loading...
          </Button>
        )}
      </div>
    </div>
  );
}
