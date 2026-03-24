import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-halo backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
