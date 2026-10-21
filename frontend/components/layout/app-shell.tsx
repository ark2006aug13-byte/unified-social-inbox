"use client";

import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useShell } from "@/components/providers/shell-provider";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed } = useShell();

  return (
    <div
      className={cn(
        "mx-auto grid min-h-screen w-full max-w-[1800px] gap-4 px-3 py-4 transition-[grid-template-columns] duration-200 sm:gap-5 sm:px-5 sm:py-5",
        collapsed
          ? "lg:grid-cols-[84px_minmax(0,1fr)]"
          : "lg:grid-cols-[264px_minmax(0,1fr)]",
      )}
    >
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <MobileNav />
        <Topbar />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
