import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getUserReservationHistory,
} from "@/lib/meals";
import { ReservationHistory } from "@/components/history/reservation-history";
import { parseReservationStatus } from "@/lib/meals/reservation-status";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, PermissionCode.RESERVATION_CREATE)) redirect("/menu");

  const rows = await getUserReservationHistory(session.userId);

  const mealPeriods = Array.from(
    new Map(
      rows.map((row) => [
        row.mealPeriodId,
        { id: row.mealPeriodId, title: row.mealPeriod.title },
      ]),
    ).values(),
  );

  return (
    <ReservationHistory
      rows={rows.map((row) => ({
        id: row.id,
        dateKey: formatDateKey(row.date),
        displayDate: formatDisplayDate(row.date),
        mealPeriodId: row.mealPeriodId,
        mealPeriodTitle: row.mealPeriod.title,
        foodTitle: row.food.title,
        quantity: row.quantity,
        drinkTitle: row.drinkFood?.title ?? null,
        sideTitle: row.sideFood?.title ?? null,
        deliveryLocationTitle: row.deliveryLocation.title,
        deliveryLocationAddress: row.deliveryLocation.address,
        status: parseReservationStatus(row.status),
      }))}
      mealPeriods={mealPeriods}
    />
  );
}
