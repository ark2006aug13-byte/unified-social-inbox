"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Radio, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "A live view of every conversation flowing through your workspace.",
  },
  "/inbox": {
    title: "Unified Inbox",
    subtitle: "Search, triage and reply across every connected channel.",
  },
  "/gmail": {
    title: "Gmail",
    subtitle: "Everything arriving in your Gmail inbox, synced on demand.",
  },
  "/integrations": {
    title: "Integrations",
    subtitle: "Connect the channels your team works in.",
  },
  "/ai-assistant": {
    title: "AI Assistant",
    subtitle: "Summaries, priorities and drafts generated for every thread.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your account, connections and runtime configuration.",
  },
};

export function Topbar() {
  const pathname = usePathname();
  const { session, logout, login, loading, error } = useSession();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const meta = PAGE_META[pathname] ?? {
    title: "Unified Social Inbox",
    subtitle: "Manage every conversation from one place.",
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out", "Your session has been cleared.");
    } catch (_error) {
      toast.error("Sign out failed", "Please try again in a moment.");
    }
  };

  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-halo backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 md:flex-row md:items-center md:justify-between md:p-5">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl dark:text-slate-50">
          {meta.title}
        </h1>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
          {meta.subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
            error
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
          )}
          title={error ?? "Connected to the backend"}
        >
          {error ? <ShieldAlert className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
          {error ? "Offline" : "Live"}
        </div>

        <ThemeToggle />

        {mounted && !loading && session?.authenticated ? (
          <div className="flex items-center gap-2">
            <Avatar
              name={session.user?.name}
              src={session.user?.avatarUrl}
              size="sm"
              className="hidden sm:inline-flex"
            />
            <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        ) : mounted && !loading ? (
          <Button size="sm" onClick={login}>
            Sign in with Google
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            Loading...
          </Button>
        )}
      </div>
    </header>
  );
}
