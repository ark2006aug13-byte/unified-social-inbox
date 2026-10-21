import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Unified Social Inbox",
    template: "%s · Unified Social Inbox",
  },
  description:
    "Search, triage and reply across Gmail and every connected channel from one workspace.",
  applicationName: "Unified Social Inbox",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1221" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-50 text-slate-900 antialiased dark:bg-surface-900 dark:text-slate-100">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-[0.35] dark:opacity-[0.12]" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
