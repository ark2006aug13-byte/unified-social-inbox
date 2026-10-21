"use client";

import type { ReactNode } from "react";
import { BackendConnectionCheck } from "@/components/providers/backend-connection-check";
import { SessionProvider } from "@/components/providers/session-provider";
import { ShellProvider } from "@/components/providers/shell-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SessionProvider>
          <ShellProvider>
            <BackendConnectionCheck />
            {children}
          </ShellProvider>
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
