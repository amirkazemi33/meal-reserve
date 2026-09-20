import { prisma } from "@/lib/prisma";
import {
  CUTOFF_SETTING_KEY,
  DEFAULT_CUTOFF_TIME,
} from "@/lib/auth/constants";
import { addDays, startOfDay } from "@/lib/meals/dates";

export async function getCutoffTime(): Promise<string> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: CUTOFF_SETTING_KEY },
  });
  return setting?.value ?? DEFAULT_CUTOFF_TIME;
}

export async function setCutoffTime(value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: CUTOFF_SETTING_KEY },
    create: { key: CUTOFF_SETTING_KEY, value },
    update: { value },
  });
}

/** Parse "HH:mm" into hours/minutes. */
export function parseCutoffTime(cutoff: string): { hours: number; minutes: number } {
  const [hours, minutes] = cutoff.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

/**
 * Reservations for target date D are editable until cutoff on day D-1.
 * For today and past dates: always locked.
 * For tomorrow+: locked if now is on/after cutoff of the day before the target.
 */
export function isReservationEditable(
  targetDate: Date,
  now: Date,
  cutoffTime: string,
): boolean {
  const target = startOfDay(targetDate);
  const today = startOfDay(now);

  if (target <= today) {
    return false;
  }

  const deadlineDay = addDays(target, -1);
  const { hours, minutes } = parseCutoffTime(cutoffTime);
  const deadline = new Date(deadlineDay);
  deadline.setHours(hours, minutes, 0, 0);

  return now < deadline;
}

/**
 * Earliest calendar day the user can still reserve for.
 * Before today's cutoff → tomorrow; after → the day after tomorrow.
 */
export function getNextReservableDate(now: Date, cutoffTime: string): Date {
  let candidate = addDays(startOfDay(now), 1);
  for (let i = 0; i < 14; i++) {
    if (isReservationEditable(candidate, now, cutoffTime)) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }
  return addDays(startOfDay(now), 1);
}
