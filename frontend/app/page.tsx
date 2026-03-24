import { ArrowRight, Bot, Inbox, Link2, Mail } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Unified inbox",
    description: "Review Gmail first, then layer on Instagram, WhatsApp, Messenger, and Twitter.",
    icon: Inbox,
  },
  {
    title: "AI assistant",
    description: "Generate summaries, smart replies, and categories directly from the message detail pane.",
    icon: Bot,
  },
  {
    title: "Integration ready",
    description: "The backend registry is modular so future providers plug into the same contract.",
    icon: Link2,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-8 px-4 py-10">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-slate-200/80 bg-white/85 p-8 dark:border-slate-800 dark:bg-slate-950/85">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-950">
            <Mail className="h-4 w-4" />
            Unified Social Inbox
          </div>
          <h1 className="mt-8 max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Gmail-first unified messaging for teams that need speed, clarity, and AI support.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Connect Google, sync your inbox, search every thread, and draft better responses from a single dashboard built for modern operations teams.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GoogleLoginButton />
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Explore features
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Card>

        <Card className="grid gap-4 bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 dark:border-slate-200 dark:bg-slate-100">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60 dark:text-slate-500">
              Core flows
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white/8 p-4 dark:bg-slate-200">
                <p className="font-semibold">1. Google OAuth login</p>
                <p className="mt-2 text-sm text-white/70 dark:text-slate-600">
                  Secure authentication with a session cookie managed by the backend.
                </p>
              </div>
              <div className="rounded-3xl bg-white/8 p-4 dark:bg-slate-200">
                <p className="font-semibold">2. Gmail connect and sync</p>
                <p className="mt-2 text-sm text-white/70 dark:text-slate-600">
                  Pull messages into PostgreSQL with a provider abstraction ready for expansion.
                </p>
              </div>
              <div className="rounded-3xl bg-white/8 p-4 dark:bg-slate-200">
                <p className="font-semibold">3. AI summaries and reply suggestions</p>
                <p className="mt-2 text-sm text-white/70 dark:text-slate-600">
                  Use the OpenAI-backed assistant to move through threads with less context switching.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="features" className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
