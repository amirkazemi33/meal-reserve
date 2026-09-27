import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { can, redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getDeliveryLocations,
  getMealPeriods,
  getMenuForRange,
  getReservationsReport,
  listOwnedUserListsWithMembers,
  parseDateKey,
} from "@/lib/meals";
import type { FoodKindValue } from "@/lib/meals/food-kind";
import {
  ReservationsReportTable,
  type DayMenuPeriodOption,
} from "@/components/admin/reservations-report-table";

type SearchParams = Promise<{ date?: string; to?: string }>;

function buildMenusByDate(
  menuItems: Awaited<ReturnType<typeof getMenuForRange>>,
  mealPeriods: Awaited<ReturnType<typeof getMealPeriods>>,
): Record<string, DayMenuPeriodOption[]> {
  const byDate = new Map<string, typeof menuItems>();
  for (const item of menuItems) {
    const key = formatDateKey(item.date);
    const list = byDate.get(key);
    if (list) list.push(item);
    else byDate.set(key, [item]);
  }

  const result: Record<string, DayMenuPeriodOption[]> = {};
  for (const [dateKey, items] of byDate) {
    result[dateKey] = mealPeriods
      .map((period) => ({
        id: period.id,
        title: period.title,
        foods: items
          .filter((item) => item.mealPeriodId === period.id)
          .map((item) => ({
            menuItemId: item.id,
            foodId: item.foodId,
            title: item.food.title,
            description: item.food.description,
            kind: item.food.kind as FoodKindValue,
          })),
      }))
      .filter((period) => period.foods.length > 0);
  }
  return result;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.REPORT_RESERVATIONS);

  const params = await searchParams;
  const fromDate = params.date ? parseDateKey(params.date) : new Date();
  let toDate = params.to ? parseDateKey(params.to) : fromDate;
  if (toDate < fromDate) {
    toDate = fromDate;
  }

  const canManageUserLists = can(session, PermissionCode.USER_LIST_MANAGE);
  const [report, deliveryLocations, mealPeriods, menuItems, userLists] =
    await Promise.all([
      getReservationsReport(fromDate, toDate),
      getDeliveryLocations(false),
      getMealPeriods(),
      getMenuForRange(fromDate, toDate),
      canManageUserLists
        ? listOwnedUserListsWithMembers(session!.userId)
        : Promise.resolve([]),
    ]);

  const fromKey = formatDateKey(fromDate);
  const toKey = formatDateKey(toDate);
  const menusByDate = buildMenusByDate(menuItems, mealPeriods);
  const rangeLabel =
    fromKey === toKey
      ? formatDisplayDate(fromDate)
      : `${formatDisplayDate(fromDate)} تا ${formatDisplayDate(toDate)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            مدیریت رزروها
          </h1>
          <p className="text-muted-foreground text-sm">
            فهرست رزروهای فعال برای {rangeLabel}.
          </p>
        </div>
        {can(session, PermissionCode.RESERVATION_FOR_OTHERS) ? (
          <Link
            href={`/admin/reserve-for?date=${encodeURIComponent(fromKey)}`}
            className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
          >
            رزرو برای دیگران
          </Link>
        ) : null}
      </div>

      <ReservationsReportTable
        key={`${fromKey}:${toKey}`}
        rows={report.rows}
        fromDateKey={fromKey}
        toDateKey={toKey}
        menusByDate={menusByDate}
        mealPeriods={mealPeriods.map((period) => ({
          id: period.id,
          title: period.title,
        }))}
        deliveryLocations={deliveryLocations.map((location) => ({
          id: location.id,
          title: location.title,
        }))}
        userLists={userLists}
        canSetQuantity={can(session, PermissionCode.RESERVATION_QUANTITY)}
      />
    </div>
  );
}
