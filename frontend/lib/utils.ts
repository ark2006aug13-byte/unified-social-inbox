import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  MessagesSquare,
  Twitter,
} from "lucide-react";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(date);
}

/**
 * Compact relative timestamp used in dense lists.
 */
export function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);

  if (Math.abs(minutes) < 1) {
    return "just now";
  }

  if (Math.abs(minutes) < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export function formatProvider(value: string) {
  switch (value?.toLowerCase()) {
    case "gmail":
      return "Gmail";
    case "instagram":
      return "Instagram";
    case "whatsapp":
      return "WhatsApp";
    case "facebook":
      return "Facebook";
    case "twitter":
      return "Twitter";
    case "facebook_messenger":
    case "facebook-messenger":
      return "Facebook Messenger";
    default:
      if (!value) {
        return "Unknown";
      }
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

export function getInitials(name?: string | null) {
  if (!name) {
    return "UI";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type ProviderStyle = {
  label: string;
  icon: LucideIcon;
  chip: string;
  accent: string;
};

const PROVIDER_STYLES: Record<string, ProviderStyle> = {
  gmail: {
    label: "Gmail",
    icon: Mail,
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    accent: "text-rose-600 dark:text-rose-400",
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    chip: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  facebook: {
    label: "Facebook",
    icon: Facebook,
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    accent: "text-sky-600 dark:text-sky-400",
  },
  facebook_messenger: {
    label: "Messenger",
    icon: MessagesSquare,
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    accent: "text-sky-600 dark:text-sky-400",
  },
  twitter: {
    label: "Twitter",
    icon: Twitter,
    chip: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    accent: "text-slate-700 dark:text-slate-200",
  },
};

const FALLBACK_PROVIDER: ProviderStyle = {
  label: "Other",
  icon: MessageCircle,
  chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  accent: "text-slate-600 dark:text-slate-300",
};

export function getProviderStyle(provider?: string | null): ProviderStyle {
  const key = (provider || "").toLowerCase();
  return PROVIDER_STYLES[key] || { ...FALLBACK_PROVIDER, label: formatProvider(key) };
}

export function formatCategory(category?: string | null) {
  if (!category) {
    return "Uncategorized";
  }

  return category
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural || `${singular}s`;
}

export function truncate(value: string, length: number) {
  if (!value) {
    return "";
  }

  return value.length > length ? `${value.slice(0, length - 1).trimEnd()}…` : value;
}
