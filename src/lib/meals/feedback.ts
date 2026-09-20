import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@/generated/prisma/client";
import { addDays, startOfDay } from "@/lib/meals/dates";

export async function getFeedbackCandidates(
  userId: string,
  daysBack = 7,
) {
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
