"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function CollapsibleDaySection({
  dateLabel,
  isToday,
  children,
}: {
  dateLabel: string;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(isToday);

  return (
    <section
      className={
        isToday
          ? "space-y-3 rounded-2xl border border-emerald-700/25 bg-[linear-gradient(180deg,#ecfdf5_0%,#f0fdf4_55%,transparent_100%)] p-3 shadow-[0_1px_0_rgba(6,95,70,0.08)] sm:p-4"
          : "border-border/60 space-y-3 rounded-2xl border bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_55%,transparent_100%)] p-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:p-4"
      }
    >
      <h2
        className={
          isToday
            ? "sticky top-[var(--app-header-height,0px)] z-10 -mx-1 flex items-center gap-2 rounded-lg border border-emerald-700/20 bg-[color-mix(in_oklch,#d1fae5_92%,transparent)] px-2 py-2 text-lg font-semibold text-emerald-950 shadow-sm backdrop-blur-sm"
            : "sticky top-[var(--app-header-height,0px)] z-10 -mx-1 flex items-center gap-2 rounded-lg border border-border/70 bg-[color-mix(in_oklch,var(--background)_92%,transparent)] px-2 py-2 text-lg font-semibold shadow-sm backdrop-blur-sm"
        }
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-2 text-start"
        >
          <span>{dateLabel}</span>
          {isToday ? (
            <span className="rounded-md bg-emerald-800 px-2 py-0.5 text-xs font-medium text-emerald-50">
              امروز
            </span>
          ) : null}
          <span
            className={cn(
              "ms-auto inline-flex size-7 shrink-0 items-center justify-center rounded-md border",
              isToday
                ? "border-emerald-700/25 bg-white/70"
                : "border-border bg-background",
            )}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </span>
        </button>
      </h2>
      <div hidden={!open}>{children}</div>
    </section>
  );
}
