"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  const nf = new Intl.NumberFormat("fa-IR");
  if (ms <= 60_000) return "کمتر از یک دقیقه";

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${nf.format(days)} روز`);
  if (hours) parts.push(`${nf.format(hours)} ساعت`);
  if (minutes) parts.push(`${nf.format(minutes)} دقیقه`);
  return parts.join(" و ");
}

export function ReservationDeadline({
  deadlineIso,
  nowIso,
  dateLabel,
  timeLabel,
}: {
  deadlineIso: string;
  nowIso: string;
  dateLabel: string;
  timeLabel: string;
}) {
  const [nowMs, setNowMs] = useState(() => new Date(nowIso).getTime());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const deadlineMs = new Date(deadlineIso).getTime();
  const remaining = deadlineMs - nowMs;
  const open = remaining > 0;
  const windowMs = 24 * 60 * 60 * 1000;
  const raw = ((nowMs - (deadlineMs - windowMs)) / windowMs) * 100;
  const progress = open ? Math.max(4, Math.min(100, raw)) : 100;

  return (
    <section className="flex flex-col gap-1.5 pt-1">
      <h1 className="text-booking-heading text-[22px] leading-tight font-semibold tracking-tight whitespace-nowrap">
        {open ? (
          <>
            {formatRemaining(remaining)}{" "}
            <span className="text-[12px] font-medium md:text-[22px] md:font-semibold">
              تا پایان مهلت رزرو
            </span>
          </>
        ) : (
          "مهلت رزرو تمام شد"
        )}
      </h1>
      <p className="text-booking-secondary text-xs">
        {open
          ? `${dateLabel} تا ${timeLabel}`
          : `مهلت تا ${timeLabel}، ${dateLabel} بود`}
      </p>
      <div className="bg-booking-line mt-2.5 h-0.5 overflow-hidden rounded-sm">
        <div
          className="bg-booking-brand h-0.5 rounded-sm transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}
