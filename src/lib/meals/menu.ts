import { prisma } from "@/lib/prisma";
import {
  addDays,
  eachDay,
  formatDateKey,
  startOfDay,
  startOfWeek,
} from "@/lib/meals/dates";
import { getCutoffTime, isReservationEditable } from "@/lib/meals/cutoff";

export async function getMealPeriods() {
  return prisma.mealPeriod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllMealPeriods() {
  return prisma.mealPeriod.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getFoods(activeOnly = true) {
  return prisma.food.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { title: "asc" },
  });
}

export async function getMenuForRange(from: Date, to: Date) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  end.setHours(23, 59, 59, 999);

  return prisma.menuItem.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: {
      food: true,
      mealPeriod: true,
    },
    orderBy: [{ date: "asc" }, { mealPeriod: { sortOrder: "asc" } }],
  });
}

/** Week starts (Sat) that have at least one menu day with food. */
export async function getAvailableMenuWeeks(): Promise<Date[]> {
  const dates = await prisma.menuItem.findMany({
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "asc" },
  });

  const seen = new Set<string>();
  const weeks: Date[] = [];

  for (const row of dates) {
    const weekStart = startOfWeek(row.date);
    const key = formatDateKey(weekStart);
    if (!seen.has(key)) {
      seen.add(key);
      weeks.push(weekStart);
    }
  }

  return weeks;
}

export async function getWeeklyMenu(anchor = new Date()) {
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 6);
  const [menuItems, mealPeriods, cutoffTime] = await Promise.all([
    getMenuForRange(weekStart, weekEnd),
    getMealPeriods(),
    getCutoffTime(),
  ]);

  const days = eachDay(weekStart, weekEnd).map((date) => ({
    date,
    editable: isReservationEditable(date, new Date(), cutoffTime),
  }));

  return { days, mealPeriods, menuItems, cutoffTime, weekStart, weekEnd };
}

export async function getDailyMenu(date: Date) {
  const day = startOfDay(date);
  const [menuItems, mealPeriods, cutoffTime] = await Promise.all([
    getMenuForRange(day, day),
    getMealPeriods(),
    getCutoffTime(),
  ]);

  return {
    date: day,
    editable: isReservationEditable(day, new Date(), cutoffTime),
    mealPeriods,
    menuItems,
    cutoffTime,
  };
}
