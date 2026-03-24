"use client";

import type { ReactNode } from "react";
import { BackendConnectionCheck } from "@/components/providers/backend-connection-check";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BackendConnectionCheck />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
