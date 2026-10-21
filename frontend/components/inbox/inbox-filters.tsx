"use client";

import { X } from "lucide-react";
import { cn, getProviderStyle } from "@/lib/utils";
import type { ProviderKey } from "@/lib/types";

export const PROVIDER_FILTERS: Array<{ key: "all" | ProviderKey; label: string }> = [
  { key: "all", label: "All channels" },
  { key: "gmail", label: "Gmail" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
];

export const CATEGORY_FILTERS = [
  { key: "all", label: "Everything" },
  { key: "brand_deal", label: "Brand deals" },
  { key: "support", label: "Support" },
  { key: "sales", label: "Sales" },
  { key: "operations", label: "Operations" },
  { key: "other", label: "Other" },
];

function FilterChip({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
        active
          ? "bg-slate-950 text-white shadow-lift dark:bg-white dark:text-slate-950"
          : "bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function InboxFilters({
  provider,
  category,
  onProviderChange,
  onCategoryChange,
  lockedProvider,
  resultCount,
}: {
  provider: string;
  category: string;
  onProviderChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  lockedProvider?: string;
  resultCount: number;
}) {
  return (
    <div className="space-y-2.5">
      {!lockedProvider ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {PROVIDER_FILTERS.map((item) => {
            const style = getProviderStyle(item.key === "all" ? null : item.key);
            const Icon = style.icon;

            return (
              <FilterChip
                key={item.key}
                active={provider === item.key}
                label={item.label}
                onClick={() => onProviderChange(item.key)}
                icon={
                  item.key === "all" ? null : (
                    <Icon className="h-3.5 w-3.5" />
                  )
                }
              />
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_FILTERS.map((item) => (
          <FilterChip
            key={item.key}
            active={category === item.key}
            label={item.label}
            onClick={() => onCategoryChange(item.key)}
          />
        ))}
        <span className="ml-auto text-xs font-medium text-slate-400 dark:text-slate-500">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search sender, subject or body",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="group relative flex items-center">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search conversations"
        className="h-10 w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-900/40"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
