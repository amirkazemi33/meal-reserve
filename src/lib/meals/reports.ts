import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@/generated/prisma/client";
import { startOfDay } from "@/lib/meals/dates";

export async function getCookingReport(date: Date) {
  const day = startOfDay(date);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: day, lte: end },
      status: ReservationStatus.ACTIVE,
    },
    include: {
      food: true,
      mealPeriod: true,
    },
  });

  const byKey = new Map<
    string,
    {
      mealPeriodId: string;
      mealPeriodTitle: string;
      foodId: string;
      foodTitle: string;
      count: number;
    }
  >();

  for (const reservation of reservations) {
    const key = `${reservation.mealPeriodId}:${reservation.foodId}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        mealPeriodId: reservation.mealPeriodId,
        mealPeriodTitle: reservation.mealPeriod.title,
        foodId: reservation.foodId,
        foodTitle: reservation.food.title,
        count: 1,
      });
    }
  }

  return {
    date: day,
    total: reservations.length,
    rows: [...byKey.values()].sort((a, b) =>
      a.mealPeriodTitle === b.mealPeriodTitle
        ? a.foodTitle.localeCompare(b.foodTitle)
        : a.mealPeriodTitle.localeCompare(b.mealPeriodTitle),
    ),
  };
}
