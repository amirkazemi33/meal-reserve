import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getAllReservationHistory,
  getUserReservationHistory,
} from "@/lib/meals";
import { ReservationHistory } from "@/components/history/reservation-history";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, PermissionCode.RESERVATION_CREATE)) redirect("/menu");

  const canManageAll = can(session, PermissionCode.REPORT_RESERVATIONS);
  const canChangeStatus =
    canManageAll || can(session, PermissionCode.RESERVATION_CANCEL);

  const rows = canManageAll
    ? await getAllReservationHistory()
    : await getUserReservationHistory(session.userId);

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
        status: row.status,
        userName: row.user.name,
        userLastName: row.user.lastName,
        userPhone: row.user.phone,
      }))}
      mealPeriods={mealPeriods}
      canChangeStatus={canChangeStatus}
      canSearchUsers={canManageAll}
    />
  );
}
