"use client";

import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="space-y-6">
        <MobileNav />
        <Topbar />
        {children}
      </main>
    </div>
  );
}
