import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@/lib/meals/reservation-status";
import {
  formatDateKey,
  formatDisplayDate,
  startOfDay,
} from "@/lib/meals/dates";

type FoodTotalRow = {
  mealPeriodId: string;
  mealPeriodTitle: string;
  foodId: string;
  foodTitle: string;
  count: number;
};

type LocationBreakdownRow = FoodTotalRow & {
  deliveryLocationId: string;
  deliveryLocationTitle: string;
};

type LocationGroup = {
  deliveryLocationId: string;
  deliveryLocationTitle: string;
  total: number;
  rows: FoodTotalRow[];
};

export async function getReservationsReport(from: Date, to: Date = from) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  end.setHours(23, 59, 59, 999);

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: start, lte: end },
      status: ReservationStatus.ACTIVE,
    },
    include: {
      food: true,
      drinkFood: true,
      sideFood: true,
      mealPeriod: true,
      deliveryLocation: true,
      user: {
        select: {
          id: true,
          name: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: [
      { date: "asc" },
      { mealPeriod: { sortOrder: "asc" } },
      { user: { lastName: "asc" } },
      { user: { name: "asc" } },
    ],
  });

  return {
    from: start,
    to: startOfDay(to),
    total: reservations.length,
    rows: reservations.map((reservation) => ({
      id: reservation.id,
      dateKey: formatDateKey(reservation.date),
      displayDate: formatDisplayDate(reservation.date),
      userId: reservation.userId,
      userName: reservation.user.name,
      userLastName: reservation.user.lastName,
      userPhone: reservation.user.phone,
      mealPeriodId: reservation.mealPeriodId,
      mealPeriodTitle: reservation.mealPeriod.title,
      foodId: reservation.foodId,
      foodTitle: reservation.food.title,
      drinkTitle: reservation.drinkFood?.title ?? null,
      sideTitle: reservation.sideFood?.title ?? null,
      drinkMenuItemId: reservation.drinkMenuItemId,
      sideMenuItemId: reservation.sideMenuItemId,
      drinkFoodId: reservation.drinkFoodId,
      sideFoodId: reservation.sideFoodId,
      quantity: reservation.quantity,
      deliveryLocationId: reservation.deliveryLocationId,
      deliveryLocationTitle: reservation.deliveryLocation.title,
    })),
  };
}

export async function getCookingReport(
  date: Date,
  options?: { mealPeriodId?: string },
) {
  const day = startOfDay(date);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  const mealPeriodId = options?.mealPeriodId;

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: day, lte: end },
      status: ReservationStatus.ACTIVE,
      ...(mealPeriodId ? { mealPeriodId } : {}),
    },
    include: {
      food: true,
      drinkFood: true,
      sideFood: true,
      mealPeriod: true,
      deliveryLocation: true,
    },
  });

  const byDetail = new Map<string, LocationBreakdownRow>();
  const byFood = new Map<string, FoodTotalRow>();
  const byLocation = new Map<string, LocationGroup>();

  for (const reservation of reservations) {
    const portions = [
      { foodId: reservation.foodId, foodTitle: reservation.food.title },
    ];
    if (reservation.drinkFoodId && reservation.drinkFood) {
      portions.push({
        foodId: reservation.drinkFoodId,
        foodTitle: reservation.drinkFood.title,
      });
    }
    if (reservation.sideFoodId && reservation.sideFood) {
      portions.push({
        foodId: reservation.sideFoodId,
        foodTitle: reservation.sideFood.title,
      });
    }

    const amount = reservation.quantity >= 1 ? reservation.quantity : 1;

    for (const portion of portions) {
      const detailKey = `${reservation.mealPeriodId}:${portion.foodId}:${reservation.deliveryLocationId}`;
      const detail = byDetail.get(detailKey);
      if (detail) {
        detail.count += amount;
      } else {
        byDetail.set(detailKey, {
          mealPeriodId: reservation.mealPeriodId,
          mealPeriodTitle: reservation.mealPeriod.title,
          foodId: portion.foodId,
          foodTitle: portion.foodTitle,
          deliveryLocationId: reservation.deliveryLocationId,
          deliveryLocationTitle: reservation.deliveryLocation.title,
          count: amount,
        });
      }

      const foodKey = `${reservation.mealPeriodId}:${portion.foodId}`;
      const foodTotal = byFood.get(foodKey);
      if (foodTotal) {
        foodTotal.count += amount;
      } else {
        byFood.set(foodKey, {
          mealPeriodId: reservation.mealPeriodId,
          mealPeriodTitle: reservation.mealPeriod.title,
          foodId: portion.foodId,
          foodTitle: portion.foodTitle,
          count: amount,
        });
      }

      const location = byLocation.get(reservation.deliveryLocationId);
      if (!location) {
        byLocation.set(reservation.deliveryLocationId, {
          deliveryLocationId: reservation.deliveryLocationId,
          deliveryLocationTitle: reservation.deliveryLocation.title,
          total: amount,
          rows: [
            {
              mealPeriodId: reservation.mealPeriodId,
              mealPeriodTitle: reservation.mealPeriod.title,
              foodId: portion.foodId,
              foodTitle: portion.foodTitle,
              count: amount,
            },
          ],
        });
      } else {
        location.total += amount;
        const existingRow = location.rows.find(
          (row) =>
            row.mealPeriodId === reservation.mealPeriodId &&
            row.foodId === portion.foodId,
        );
        if (existingRow) {
          existingRow.count += amount;
        } else {
          location.rows.push({
            mealPeriodId: reservation.mealPeriodId,
            mealPeriodTitle: reservation.mealPeriod.title,
            foodId: portion.foodId,
            foodTitle: portion.foodTitle,
            count: amount,
          });
        }
      }
    }
  }

  const sortFoodRows = (a: FoodTotalRow, b: FoodTotalRow) => {
    if (a.mealPeriodTitle !== b.mealPeriodTitle) {
      return a.mealPeriodTitle.localeCompare(b.mealPeriodTitle);
    }
    return a.foodTitle.localeCompare(b.foodTitle);
  };

  const locations = [...byLocation.values()]
    .map((location) => ({
      ...location,
      rows: [...location.rows].sort(sortFoodRows),
    }))
    .sort((a, b) =>
      a.deliveryLocationTitle.localeCompare(b.deliveryLocationTitle),
    );

  return {
    date: day,
    total: reservations.length,
    rows: [...byDetail.values()].sort((a, b) => {
      const foodCompare = sortFoodRows(a, b);
      if (foodCompare !== 0) return foodCompare;
      return a.deliveryLocationTitle.localeCompare(b.deliveryLocationTitle);
    }),
    foodTotals: [...byFood.values()].sort(sortFoodRows),
    locations,
  };
}
