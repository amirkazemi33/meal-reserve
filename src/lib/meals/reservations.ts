import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@/generated/prisma/client";
import { startOfDay } from "@/lib/meals/dates";
import { getCutoffTime, isReservationEditable } from "@/lib/meals/cutoff";

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
    },
  });
}

const historyInclude = {
  food: true,
  mealPeriod: true,
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
}) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: input.menuItemId },
    include: { food: true, mealPeriod: true },
  });

  if (!menuItem) {
    throw new Error("آیتم منو یافت نشد");
  }

  const cutoffTime = await getCutoffTime();
  if (!isReservationEditable(menuItem.date, new Date(), cutoffTime)) {
    throw new Error("مهلت رزرو برای این تاریخ به پایان رسیده است");
  }

  const date = startOfDay(menuItem.date);

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
      status: ReservationStatus.ACTIVE,
    },
    update: {
      foodId: menuItem.foodId,
      menuItemId: menuItem.id,
      status: ReservationStatus.ACTIVE,
    },
  });
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
