import { ArrowRight, Bot, Inbox, Link2, Mail, Sparkles } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Unified inbox",
    description:
      "Gmail today, then Instagram, WhatsApp, Messenger and Twitter through one provider contract.",
    icon: Inbox,
  },
  {
    title: "AI assistant",
    description:
      "Summaries, categories and three tailored reply drafts generated inside the message view.",
    icon: Bot,
  },
  {
    title: "Integration ready",
    description:
      "A backend registry keeps every provider behind the same contract, so new channels plug in cleanly.",
    icon: Link2,
  },
];

const steps = [
  {
    title: "Google OAuth login",
    description:
      "A server-side OAuth flow issues a signed, httpOnly session cookie.",
  },
  {
    title: "Gmail connect and sync",
    description:
      "Read-only Gmail access, encrypted tokens, messages stored in PostgreSQL.",
  },
  {
    title: "AI summaries and drafts",
    description:
      "OpenAI structured outputs classify and draft replies on demand.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-8 px-4 py-10 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-950">
            <Mail className="h-4 w-4" />
            Unified Social Inbox
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            Every customer conversation, in one calm workspace.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            Connect Google, sync your inbox, search across every thread and
            draft better responses from a single dashboard built for modern
            operations teams.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GoogleLoginButton />
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              Explore features
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Card>

        <Card className="overflow-hidden p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                Core flows
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                From sign-in to first reply
              </p>
            </div>
          </div>

          <ol className="mt-6 space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-3.5 rounded-[22px] border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section id="features" className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.title} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Icon className="h-5 w-5" />
                </span>
                <Badge plain>Built in</Badge>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                {feature.title}
              </h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
