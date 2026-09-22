import { prisma } from "@/lib/prisma";
import { FoodKind, ReservationStatus } from "@/generated/prisma/client";
import { startOfDay } from "@/lib/meals/dates";
import { getCutoffTime, isReservationEditable } from "@/lib/meals/cutoff";
import { parseReservationQuantity } from "@/lib/meals/quantity";

const addonInclude = {
  drinkFood: true,
  sideFood: true,
} as const;

async function resolveAddonMenuItem(input: {
  menuItemId?: string | null;
  expectedKind: FoodKind;
  date: Date;
  mealPeriodId: string;
}) {
  const id = input.menuItemId?.trim();
  if (!id) {
    return { foodId: null, menuItemId: null };
  }

  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: { food: true },
  });

  if (!item || item.food.kind !== input.expectedKind) {
    throw new Error("آیتم افزودنی معتبر نیست");
  }

  if (startOfDay(item.date).getTime() !== startOfDay(input.date).getTime()) {
    throw new Error("افزودنی باید مربوط به همان روز باشد");
  }

  if (item.mealPeriodId !== input.mealPeriodId) {
    throw new Error("افزودنی باید مربوط به همان وعده باشد");
  }

  return { foodId: item.foodId, menuItemId: item.id };
}

export async function getUserReservationsForRange(
  userId: string,
  from: Date,
  to: Date,
) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  end.setHours(23, 59, 59, 999);

  return prisma.reservation.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
      status: ReservationStatus.ACTIVE,
    },
    include: {
      food: true,
      mealPeriod: true,
      deliveryLocation: true,
      ...addonInclude,
    },
  });
}

const historyInclude = {
  food: true,
  ...addonInclude,
  mealPeriod: true,
  deliveryLocation: true,
  feedback: true,
  user: {
    select: {
      id: true,
      name: true,
      lastName: true,
      phone: true,
    },
  },
} as const;

export async function getUserReservationHistory(userId: string) {
  return prisma.reservation.findMany({
    where: { userId },
    include: historyInclude,
    orderBy: [{ date: "desc" }, { mealPeriod: { sortOrder: "asc" } }],
  });
}

export async function getAllReservationHistory() {
  return prisma.reservation.findMany({
    include: historyInclude,
    orderBy: [{ date: "desc" }, { mealPeriod: { sortOrder: "asc" } }],
  });
}

export async function upsertReservation(input: {
  userId: string;
  menuItemId: string;
  deliveryLocationId?: string | null;
  canSelectDeliveryLocation?: boolean;
  drinkMenuItemId?: string | null;
  sideMenuItemId?: string | null;
  quantity?: number | null;
  canSetQuantity?: boolean;
}) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: input.menuItemId },
    include: { food: true, mealPeriod: true },
  });

  if (!menuItem) {
    throw new Error("آیتم منو یافت نشد");
  }

  if (menuItem.food.kind !== FoodKind.MAIN) {
    throw new Error("فقط غذای اصلی قابل رزرو است");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { deliveryLocationId: true, isActive: true },
  });

  if (!user) {
    throw new Error("کاربر یافت نشد");
  }

  if (!user.isActive) {
    throw new Error("کاربر غیرفعال است");
  }

  let deliveryLocationId = user.deliveryLocationId;

  if (input.canSelectDeliveryLocation && input.deliveryLocationId) {
    const location = await prisma.deliveryLocation.findFirst({
      where: { id: input.deliveryLocationId, isActive: true },
      select: { id: true },
    });
    if (location) {
      deliveryLocationId = location.id;
    }
  }

  const cutoffTime = await getCutoffTime();
  if (!isReservationEditable(menuItem.date, new Date(), cutoffTime)) {
    throw new Error("مهلت رزرو برای این تاریخ به پایان رسیده است");
  }

  const date = startOfDay(menuItem.date);
  const quantity = input.canSetQuantity
    ? parseReservationQuantity(input.quantity)
    : undefined;
  const [drink, side] = await Promise.all([
    resolveAddonMenuItem({
      menuItemId: input.drinkMenuItemId,
      expectedKind: FoodKind.DRINK,
      date,
      mealPeriodId: menuItem.mealPeriodId,
    }),
    resolveAddonMenuItem({
      menuItemId: input.sideMenuItemId,
      expectedKind: FoodKind.YOGURT_SALAD,
      date,
      mealPeriodId: menuItem.mealPeriodId,
    }),
  ]);

  return prisma.reservation.upsert({
    where: {
      userId_date_mealPeriodId: {
        userId: input.userId,
        date,
        mealPeriodId: menuItem.mealPeriodId,
      },
    },
    create: {
      userId: input.userId,
      date,
      mealPeriodId: menuItem.mealPeriodId,
      foodId: menuItem.foodId,
      menuItemId: menuItem.id,
      drinkFoodId: drink.foodId,
      drinkMenuItemId: drink.menuItemId,
      sideFoodId: side.foodId,
      sideMenuItemId: side.menuItemId,
      deliveryLocationId,
      quantity: quantity ?? 1,
      status: ReservationStatus.ACTIVE,
    },
    update: {
      foodId: menuItem.foodId,
      menuItemId: menuItem.id,
      drinkFoodId: drink.foodId,
      drinkMenuItemId: drink.menuItemId,
      sideFoodId: side.foodId,
      sideMenuItemId: side.menuItemId,
      deliveryLocationId,
      ...(quantity !== undefined ? { quantity } : {}),
      status: ReservationStatus.ACTIVE,
    },
  });
}

export type ReserveForOthersSelection = {
  menuItemId: string;
  drinkMenuItemId?: string | null;
  sideMenuItemId?: string | null;
};

export async function resolveActiveUserIdsForProxyReserve(input: {
  ownerId: string;
  userIds?: string[];
  userListId?: string | null;
}) {
  const listId = input.userListId?.trim() || null;

  if (listId) {
    const list = await prisma.userList.findFirst({
      where: { id: listId, ownerId: input.ownerId },
      include: {
        members: {
          where: { user: { isActive: true } },
          select: { userId: true },
        },
      },
    });
    if (!list) {
      throw new Error("لیست کاربر یافت نشد");
    }
    return list.members.map((member) => member.userId);
  }

  const uniqueIds = [...new Set((input.userIds ?? []).filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error("حداقل یک کاربر انتخاب کنید");
  }

  const activeUsers = await prisma.user.findMany({
    where: { id: { in: uniqueIds }, isActive: true },
    select: { id: true },
  });

  if (activeUsers.length === 0) {
    throw new Error("کاربر فعالی برای رزرو پیدا نشد");
  }

  return activeUsers.map((user) => user.id);
}

export async function upsertReservationsForOthers(input: {
  entries: Array<{
    userId: string;
    selections: ReserveForOthersSelection[];
    deliveryLocationId?: string | null;
    quantity?: number | null;
  }>;
  canSelectDeliveryLocation?: boolean;
  canSetQuantity?: boolean;
}) {
  if (input.entries.length === 0) {
    throw new Error("حداقل یک کاربر انتخاب کنید");
  }

  const results: {
    userId: string;
    menuItemId: string;
    ok: boolean;
    error?: string;
  }[] = [];

  for (const entry of input.entries) {
    if (entry.selections.length === 0) {
      results.push({
        userId: entry.userId,
        menuItemId: "",
        ok: false,
        error: "حداقل یک وعده را انتخاب کنید",
      });
      continue;
    }

    for (const selection of entry.selections) {
      try {
        await upsertReservation({
          userId: entry.userId,
          menuItemId: selection.menuItemId,
          drinkMenuItemId: selection.drinkMenuItemId,
          sideMenuItemId: selection.sideMenuItemId,
          deliveryLocationId: entry.deliveryLocationId,
          canSelectDeliveryLocation: input.canSelectDeliveryLocation,
          quantity: entry.quantity,
          canSetQuantity: input.canSetQuantity,
        });
        results.push({
          userId: entry.userId,
          menuItemId: selection.menuItemId,
          ok: true,
        });
      } catch (error) {
        results.push({
          userId: entry.userId,
          menuItemId: selection.menuItemId,
          ok: false,
          error: error instanceof Error ? error.message : "خطای ناشناخته",
        });
      }
    }
  }

  const successCount = results.filter((result) => result.ok).length;
  const failureCount = results.length - successCount;

  return { results, successCount, failureCount };
}

export async function cancelReservation(input: {
  userId: string;
  reservationId: string;
}) {
  return updateReservationStatus({
    userId: input.userId,
    reservationId: input.reservationId,
    status: ReservationStatus.CANCELLED,
  });
}

export async function updateReservationStatus(input: {
  reservationId: string;
  status: ReservationStatus;
  userId?: string;
  asAdmin?: boolean;
}) {
  const reservation = await prisma.reservation.findFirst({
    where: input.asAdmin
      ? { id: input.reservationId }
      : { id: input.reservationId, userId: input.userId },
  });

  if (!reservation) {
    throw new Error("رزرو یافت نشد");
  }

  if (!input.asAdmin) {
    const cutoffTime = await getCutoffTime();
    if (!isReservationEditable(reservation.date, new Date(), cutoffTime)) {
      throw new Error("مهلت تغییر وضعیت برای این تاریخ به پایان رسیده است");
    }
  }

  return prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: input.status },
  });
}

export async function updateReservationDeliveryLocation(input: {
  reservationId: string;
  deliveryLocationId: string;
}) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: input.reservationId,
      status: ReservationStatus.ACTIVE,
    },
  });

  if (!reservation) {
    throw new Error("رزرو یافت نشد");
  }

  const location = await prisma.deliveryLocation.findFirst({
    where: { id: input.deliveryLocationId },
    select: { id: true },
  });

  if (!location) {
    throw new Error("محل تحویل معتبر نیست");
  }

  return prisma.reservation.update({
    where: { id: reservation.id },
    data: { deliveryLocationId: location.id },
  });
}

export async function updateAdminReservation(input: {
  reservationId: string;
  menuItemId: string;
  deliveryLocationId: string;
  drinkMenuItemId?: string | null;
  sideMenuItemId?: string | null;
  quantity?: number | null;
  canSetQuantity?: boolean;
}) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: input.reservationId,
      status: ReservationStatus.ACTIVE,
    },
  });

  if (!reservation) {
    throw new Error("رزرو یافت نشد");
  }

  const [menuItem, location] = await Promise.all([
    prisma.menuItem.findUnique({
      where: { id: input.menuItemId },
      include: { food: true, mealPeriod: true },
    }),
    prisma.deliveryLocation.findFirst({
      where: { id: input.deliveryLocationId },
      select: { id: true },
    }),
  ]);

  if (!menuItem) {
    throw new Error("آیتم منو یافت نشد");
  }

  if (menuItem.food.kind !== FoodKind.MAIN) {
    throw new Error("فقط غذای اصلی قابل رزرو است");
  }

  if (!location) {
    throw new Error("محل تحویل معتبر نیست");
  }

  const reservationDay = startOfDay(reservation.date).getTime();
  const menuDay = startOfDay(menuItem.date).getTime();
  if (reservationDay !== menuDay) {
    throw new Error("غذا باید مربوط به همان روز رزرو باشد");
  }

  if (menuItem.mealPeriodId !== reservation.mealPeriodId) {
    throw new Error("غذا باید مربوط به همان وعده رزرو باشد");
  }

  const menuDate = startOfDay(menuItem.date);
  const [drink, side] = await Promise.all([
    resolveAddonMenuItem({
      menuItemId: input.drinkMenuItemId,
      expectedKind: FoodKind.DRINK,
      date: menuDate,
      mealPeriodId: menuItem.mealPeriodId,
    }),
    resolveAddonMenuItem({
      menuItemId: input.sideMenuItemId,
      expectedKind: FoodKind.YOGURT_SALAD,
      date: menuDate,
      mealPeriodId: menuItem.mealPeriodId,
    }),
  ]);

  return prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      mealPeriodId: menuItem.mealPeriodId,
      foodId: menuItem.foodId,
      menuItemId: menuItem.id,
      drinkFoodId: drink.foodId,
      drinkMenuItemId: drink.menuItemId,
      sideFoodId: side.foodId,
      sideMenuItemId: side.menuItemId,
      deliveryLocationId: location.id,
      ...(input.canSetQuantity
        ? { quantity: parseReservationQuantity(input.quantity) }
        : {}),
    },
  });
}
