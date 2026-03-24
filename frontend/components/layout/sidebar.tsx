"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronRight,
  Inbox,
  Link2,
  LayoutDashboard,
  Mail,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/integrations", label: "Integrations", icon: Link2 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, login, loading } = useSession();
  const [mounted, setMounted] = useState(false);
  const user = session?.user;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  const showLoginButton = mounted && !loading && !session?.authenticated;
  const displayName =
    mounted && !loading ? user?.name || "Guest user" : "Loading...";
  const displayEmail =
    mounted && !loading
      ? user?.email || "Sign in to unlock Gmail"
      : "Checking session";

  return (
    <aside className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col gap-6 rounded-[32px] border border-white/60 bg-white/75 p-5 shadow-halo backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="rounded-[28px] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
        <p className="text-xs uppercase tracking-[0.24em] text-white/70 dark:text-slate-500">
          Unified Social Inbox
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">USI</h1>
            <p className="text-sm text-white/70 dark:text-slate-600">Inbox for modern teams</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70 dark:text-slate-600" />
        </div>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {getInitials(mounted && !loading ? user?.name : null)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {displayEmail}
            </p>
          </div>
        </div>
        {showLoginButton ? (
          <Button className="mt-4 w-full" onClick={login}>
            Continue with Google
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
