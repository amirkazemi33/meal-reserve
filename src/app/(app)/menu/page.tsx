import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getAvailableMenuWeeks,
  getDeliveryLocations,
  getNextReservableDate,
  getUserReservationsForRange,
  getWeeklyMenu,
  parseDateKey,
  startOfDay,
  startOfWeek,
} from "@/lib/meals";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MealPeriodReserveBlock } from "@/components/menu/meal-period-reserve-block";

type SearchParams = Promise<{ week?: string; view?: string }>;

function pickWeek(anchor: Date, availableWeeks: Date[]): Date {
  if (availableWeeks.length === 0) return startOfWeek(anchor);

  const target = startOfWeek(anchor).getTime();
  const exact = availableWeeks.find((w) => w.getTime() === target);
  if (exact) return exact;

  // Prefer nearest upcoming week with food; otherwise latest past week
  const upcoming = availableWeeks.find((w) => w.getTime() >= target);
  if (upcoming) return upcoming;
  return availableWeeks[availableWeeks.length - 1]!;
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, PermissionCode.RESERVATION_CREATE)) {
    if (can(session, PermissionCode.MENU_MANAGE)) redirect("/admin/menu");
    if (can(session, PermissionCode.REPORT_COOKING))
      redirect("/cooking-report");
    redirect("/login");
  }

  const params = await searchParams;
  const availableWeeks = await getAvailableMenuWeeks();
  const requested = params.week ? parseDateKey(params.week) : new Date();
  const anchor = pickWeek(requested, availableWeeks);

  const canSelectDeliveryLocation = can(
    session,
    PermissionCode.RESERVATION_SELECT_DELIVERY_LOCATION,
  );
  const canSetQuantity = can(session, PermissionCode.RESERVATION_QUANTITY);

  const [
    { days, mealPeriods, menuItems, cutoffTime, weekStart, weekEnd },
    user,
    deliveryLocations,
  ] = await Promise.all([
    getWeeklyMenu(anchor),
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { deliveryLocationId: true },
    }),
    canSelectDeliveryLocation
      ? getDeliveryLocations(true)
      : Promise.resolve([]),
  ]);

  const reservations = await getUserReservationsForRange(
    session.userId,
    weekStart,
    weekEnd,
  );

  const reservationBySlot = new Map(
    reservations.map((r) => [`${formatDateKey(r.date)}:${r.mealPeriodId}`, r]),
  );

  const currentIndex = availableWeeks.findIndex(
    (w) => w.getTime() === weekStart.getTime(),
  );
  const prevWeekDate =
    currentIndex > 0 ? availableWeeks[currentIndex - 1] : null;
  const nextWeekDate =
    currentIndex >= 0 && currentIndex < availableWeeks.length - 1
      ? availableWeeks[currentIndex + 1]
      : null;

  const singleDay = params.view === "day";
  const now = new Date();
  const todayKey = formatDateKey(startOfDay(now));
  // First day the user can still reserve (tomorrow before cutoff, else day+2)
  const focusDate = getNextReservableDate(now, cutoffTime);
  const focusKey = formatDateKey(focusDate);
  const focusWeekday = focusDate.getDay();
  const visibleDays = singleDay
    ? days.filter((d) => d.date.getDay() === focusWeekday)
    : days;

  const locationOptions = deliveryLocations.map((location) => ({
    id: location.id,
    title: location.title,
  }));

  const fallbackLocationId = deliveryLocations.some(
    (l) => l.id === user.deliveryLocationId,
  )
    ? user.deliveryLocationId
    : (deliveryLocations[0]?.id ?? user.deliveryLocationId);

  const navLinkClass =
    "border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm";
  const navDisabledClass =
    "border-border text-muted-foreground cursor-not-allowed rounded-md border px-3 py-1.5 text-sm opacity-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">منوی هفتگی</h1>
          <p className="text-muted-foreground text-sm">
            برای رزرو غذای هر روز تا ساعت {cutoffTime} روز قبل اقدام کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prevWeekDate ? (
            <Link
              href={`/menu?week=${formatDateKey(prevWeekDate)}${singleDay ? "&view=day" : ""}`}
              className={navLinkClass}
            >
              هفته قبل
            </Link>
          ) : (
            <span className={navDisabledClass}>هفته قبل</span>
          )}
          {nextWeekDate ? (
            <Link
              href={`/menu?week=${formatDateKey(nextWeekDate)}${singleDay ? "&view=day" : ""}`}
              className={navLinkClass}
            >
              هفته بعد
            </Link>
          ) : (
            <span className={navDisabledClass}>هفته بعد</span>
          )}
          <Link
            href={
              singleDay
                ? `/menu?week=${formatDateKey(weekStart)}`
                : `/menu?week=${formatDateKey(startOfWeek(focusDate))}&view=day`
            }
            className={navLinkClass}
          >
            {singleDay ? "نمای هفته" : "روزانه"}
          </Link>
        </div>
      </div>

      {availableWeeks.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          هنوز منویی برای نمایش ثبت نشده است.
        </p>
      ) : null}

      <div
        className={
          singleDay ? "grid gap-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        }
      >
        {visibleDays.map(({ date, editable }) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === todayKey;
          const isFocusDay = dateKey === focusKey;
          const isClosed = !editable;
          const sectionClass = isFocusDay
            ? "flex flex-col gap-3 overflow-hidden rounded-xl border border-emerald-700/30 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_70%)] p-4 shadow-[0_1px_0_rgba(6,95,70,0.1)] ring-1 ring-emerald-600/10"
            : isClosed
              ? "flex flex-col gap-3 overflow-hidden rounded-xl border border-amber-700/25 bg-[linear-gradient(180deg,#fffbeb_0%,#ffffff_70%)] p-4 shadow-[0_1px_0_rgba(146,64,14,0.08)] ring-1 ring-amber-600/10"
              : "border-border/70 bg-background/90 flex flex-col gap-3 overflow-hidden rounded-xl border p-4 shadow-sm";
          const titleClass = isFocusDay
            ? "text-sm font-semibold text-emerald-950"
            : isClosed
              ? "text-sm font-semibold text-amber-950"
              : "text-sm font-semibold";
          return (
            <section key={dateKey} className={sectionClass}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={titleClass}>{formatDisplayDate(date)}</h2>
                  {isToday ? (
                    <span
                      className={
                        isFocusDay
                          ? "rounded-md bg-emerald-800 px-1.5 py-0.5 text-[10px] font-medium text-emerald-50"
                          : isClosed
                            ? "rounded-md bg-amber-800 px-1.5 py-0.5 text-[10px] font-medium text-amber-50"
                            : "bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      }
                    >
                      امروز
                    </span>
                  ) : null}
                  {isFocusDay ? (
                    <span className="rounded-md bg-emerald-800 px-1.5 py-0.5 text-[10px] font-medium text-emerald-50">
                      قابل رزرو
                    </span>
                  ) : null}
                </div>
                <Badge variant={editable ? "secondary" : "outline"}>
                  {editable ? "باز" : "بسته"}
                </Badge>
              </div>

              <Separator />

              <div className="divide-y divide-border/70">
                {mealPeriods.map((period) => {
                  const foods = menuItems.filter(
                    (item) =>
                      formatDateKey(item.date) === dateKey &&
                      item.mealPeriodId === period.id,
                  );
                  const current = reservationBySlot.get(
                    `${dateKey}:${period.id}`,
                  );
                  const slotDefaultLocationId =
                    current?.deliveryLocationId ?? fallbackLocationId;

                  return (
                    <div key={period.id} className="py-3 first:pt-0 last:pb-0">
                      <MealPeriodReserveBlock
                        periodTitle={period.title}
                        quantityInputId={`quantity-${dateKey}-${period.id}`}
                        editable={editable}
                        selectedFoodId={current?.foodId}
                        selectedDrinkMenuItemId={current?.drinkMenuItemId}
                        selectedSideMenuItemId={current?.sideMenuItemId}
                        reservationId={current?.id}
                        canSelectDeliveryLocation={canSelectDeliveryLocation}
                        canSetQuantity={canSetQuantity}
                        quantity={current?.quantity ?? 1}
                        deliveryLocations={locationOptions}
                        defaultDeliveryLocationId={slotDefaultLocationId}
                        foods={foods.map((item) => ({
                          id: item.id,
                          foodId: item.foodId,
                          title: item.food.title,
                          description: item.food.description,
                          kind: item.food.kind,
                        }))}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
