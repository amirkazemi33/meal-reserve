import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@/lib/meals/reservation-status";
import {
  addDays,
  formatDateKey,
  formatDisplayDate,
  startOfDay,
} from "@/lib/meals/dates";

export async function getFeedbackCandidates(userId: string, daysBack = 7) {
  const to = startOfDay(new Date());
  to.setHours(23, 59, 59, 999);
  const from = addDays(startOfDay(new Date()), -daysBack);

  return prisma.reservation.findMany({
    where: {
      userId,
      status: ReservationStatus.ACTIVE,
      date: { gte: from, lte: to },
    },
    include: {
      food: true,
      mealPeriod: true,
      feedback: true,
    },
    orderBy: [{ date: "desc" }, { mealPeriod: { sortOrder: "asc" } }],
  });
}

export async function upsertFeedback(input: {
  userId: string;
  reservationId: string;
  rating: number;
  comment?: string;
}) {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("امتیاز باید بین ۱ تا ۵ باشد");
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: input.reservationId,
      userId: input.userId,
      status: ReservationStatus.ACTIVE,
    },
  });

  if (!reservation) {
    throw new Error("رزرو یافت نشد");
  }

  if (startOfDay(reservation.date) > startOfDay(new Date())) {
    throw new Error("امتیازدهی برای رزرو آینده ممکن نیست");
  }

  return prisma.feedback.upsert({
    where: { reservationId: input.reservationId },
    create: {
      reservationId: input.reservationId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    },
    update: {
      rating: input.rating,
      comment: input.comment?.trim() || null,
    },
  });
}

export type FeedbackReportRow = {
  id: string;
  dateKey: string;
  displayDate: string;
  userName: string;
  userLastName: string;
  userPhone: string;
  mealPeriodId: string;
  mealPeriodTitle: string;
  foodTitle: string;
  rating: number;
  comment: string | null;
  submittedAtLabel: string;
};

function formatSubmittedAt(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function getFeedbackReport(from: Date, to: Date = from) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  end.setHours(23, 59, 59, 999);

  const rows = await prisma.feedback.findMany({
    where: {
      reservation: {
        date: { gte: start, lte: end },
      },
    },
    include: {
      user: {
        select: {
          name: true,
          lastName: true,
          phone: true,
        },
      },
      reservation: {
        include: {
          mealPeriod: true,
          food: true,
        },
      },
    },
    orderBy: [
      { reservation: { date: "desc" } },
      { reservation: { mealPeriod: { sortOrder: "asc" } } },
      { user: { lastName: "asc" } },
      { user: { name: "asc" } },
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    dateKey: formatDateKey(row.reservation.date),
    displayDate: formatDisplayDate(row.reservation.date),
    userName: row.user.name,
    userLastName: row.user.lastName,
    userPhone: row.user.phone,
    mealPeriodId: row.reservation.mealPeriodId,
    mealPeriodTitle: row.reservation.mealPeriod.title,
    foodTitle: row.reservation.food.title,
    rating: row.rating,
    comment: row.comment,
    submittedAtLabel: formatSubmittedAt(row.createdAt),
  }));
}
