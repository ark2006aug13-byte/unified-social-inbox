"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  LayoutDashboard,
  Link2,
  Mail,
  Settings,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useShell } from "@/components/providers/shell-provider";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Unified Inbox", icon: Inbox },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/integrations", label: "Integrations", icon: Link2 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, login, loading } = useSession();
  const { collapsed, toggleCollapsed } = useShell();
  const user = session?.user;

  const showLoginButton = !loading && !session?.authenticated;
  const displayName = loading ? "Loading..." : user?.name || "Guest user";
  const displayEmail = loading
    ? "Checking session"
    : user?.email || "Sign in to unlock Gmail";

  return (
    <aside
      className={cn(
        "sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-halo backdrop-blur transition-[padding] duration-200 dark:border-slate-800/80 dark:bg-slate-950/70",
        collapsed ? "px-3" : "px-4",
      )}
    >
      <div
        className={cn(
          "rounded-[22px] bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950",
          collapsed ? "grid place-items-center px-0 py-4" : "",
        )}
      >
        {collapsed ? (
          <span className="text-lg font-bold tracking-tight">US</span>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60 dark:text-slate-500">
                Unified Inbox
              </p>
              <p className="mt-1 truncate text-lg font-semibold tracking-tight">
                Social Inbox
              </p>
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-white/60 dark:text-slate-500" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                collapsed ? "justify-center" : "",
                active
                  ? "bg-slate-950 text-white shadow-lift dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "rounded-[22px] border border-slate-200/70 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70",
          collapsed ? "grid place-items-center" : "",
        )}
      >
        {collapsed ? (
          <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {displayEmail}
                </p>
              </div>
            </div>
            {showLoginButton ? (
              <Button className="mt-3 w-full" size="sm" onClick={login}>
                Continue with Google
              </Button>
            ) : null}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:text-slate-200 lg:flex"
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4" />
            Collapse
          </>
        )}
      </button>
    </aside>
  );
}
