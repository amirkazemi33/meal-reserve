"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DayStatus = "reserved" | "open" | "closed";

export type StripDay = {
  dateKey: string;
  weekday: string;
  dayNumber: string;
  isToday: boolean;
  status: DayStatus;
};

const arrowClass =
  "bg-booking-fill-soft text-booking-secondary flex size-6 shrink-0 items-center justify-center rounded-full";

function StatusDot({ status }: { status: DayStatus }) {
  return (
    <span
      className={cn(
        "size-[5px] rounded-full transition-colors",
        status === "reserved" && "bg-booking-reserved-dot",
        status === "open" && "bg-booking-brand",
        status === "closed" && "bg-booking-fill",
      )}
    />
  );
}

export function DayStrip({
  days,
  selectedDateKey,
  onSelect,
  prevWeekHref,
  nextWeekHref,
}: {
  days: StripDay[];
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
  prevWeekHref: string | null;
  nextWeekHref: string | null;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {prevWeekHref ? (
        <Link href={prevWeekHref} aria-label="هفته قبل" className={arrowClass}>
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrowClass, "opacity-35")}>
          <ChevronRight className="size-3.5" />
        </span>
      )}
      <div className="flex min-w-0 flex-1">
        {days.map((day) => {
          const selected = day.dateKey === selectedDateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onSelect(day.dateKey)}
              aria-pressed={selected}
              className={cn(
                "flex w-[14.2857%] min-w-0 flex-col items-center gap-1.5 px-0 pt-2 pb-1.5",
                !selected && day.status === "closed" && "opacity-55",
              )}
            >
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-medium tracking-tight",
                  day.isToday
                    ? "text-booking-brand"
                    : selected
                      ? "text-booking"
                      : "text-booking-muted",
                )}
              >
                {day.weekday}
              </span>
              <span
                className={cn(
                  "flex aspect-square w-[min(42px,100%)] items-center justify-center rounded-[10px] text-[15px] font-medium transition-transform",
                  selected
                    ? "bg-booking scale-105 text-white"
                    : "text-booking bg-transparent",
                  day.isToday &&
                    (selected
                      ? "shadow-[0_0_0_2px_var(--booking-page),0_0_0_4px_var(--booking-brand)]"
                      : "shadow-[inset_0_0_0_1.5px_var(--booking-brand)]"),
                )}
              >
                {day.dayNumber}
              </span>
              <StatusDot status={day.status} />
            </button>
          );
        })}
      </div>
      {nextWeekHref ? (
        <Link href={nextWeekHref} aria-label="هفته بعد" className={arrowClass}>
          <ChevronLeft className="size-3.5" />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrowClass, "opacity-35")}>
          <ChevronLeft className="size-3.5" />
        </span>
      )}
    </div>
  );
}
