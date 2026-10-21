"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Inbox, LayoutDashboard, Link2, Mail, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/integrations", label: "Integrations", icon: Link2 },
  { href: "/ai-assistant", label: "AI", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="-mx-3 overflow-x-auto px-3 lg:hidden">
      <nav className="flex min-w-max items-center gap-1.5 rounded-[22px] border border-white/60 bg-white/70 p-1.5 shadow-lift backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
