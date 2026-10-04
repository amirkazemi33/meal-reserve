import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  getAvailableMenuWeeks,
  getDeliveryLocations,
  getNextReservableDate,
  getReservationDeadline,
  getUserReservationsForRange,
  getWeeklyMenu,
  parseDateKey,
  startOfDay,
  startOfWeek,
} from "@/lib/meals";
import { prisma } from "@/lib/prisma";
import { ReserveBoard, type ReserveDay } from "@/components/menu/reserve-board";

type SearchParams = Promise<{ week?: string }>;

function pickWeek(anchor: Date, availableWeeks: Date[]): Date {
  if (availableWeeks.length === 0) return startOfWeek(anchor);

  const target = startOfWeek(anchor).getTime();
  const exact = availableWeeks.find((week) => week.getTime() === target);
  if (exact) return exact;

  const upcoming = availableWeeks.find((week) => week.getTime() >= target);
  if (upcoming) return upcoming;
  return availableWeeks[availableWeeks.length - 1]!;
}

function persianDayParts(date: Date) {
  const parts = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday");
  const dayNumber = get("day");
  const month = get("month");
  return {
    weekday,
    dayNumber,
    menuTitle: `منوی ${weekday} ${dayNumber} ${month}`,
  };
}

function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(2020, 0, 1, hours || 0, minutes || 0));
}

function deadlineLabels(date: Date) {
  const parts = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = date.getHours();
  const period = hour < 12 ? "صبح" : hour < 18 ? "عصر" : "شب";
  return {
    dateLabel: `${get("weekday")} ${get("day")} ${get("month")}`,
    timeLabel: `${get("hour")}:${get("minute")} ${period}`,
  };
}

function initialDateKeyFor(days: ReserveDay[], focusKey: string) {
  const focus = days.find((day) => day.dateKey === focusKey);
  if (focus) return focus.dateKey;
  const open = days.find((day) => day.status !== "closed");
  return open?.dateKey ?? days[0]?.dateKey ?? "";
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
    if (can(session, PermissionCode.FEEDBACK_MANAGE))
      redirect("/admin/feedback");
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
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { deliveryLocationId: true },
    }),
    canSelectDeliveryLocation
      ? getDeliveryLocations(true)
      : Promise.resolve([]),
  ]);

  if (!user) {
    redirect("/logout");
  }

  const reservations = await getUserReservationsForRange(
    session.userId,
    weekStart,
    weekEnd,
  );

  const reservationBySlot = new Map(
    reservations.map((reservation) => [
      `${formatDateKey(reservation.date)}:${reservation.mealPeriodId}`,
      reservation,
    ]),
  );

  const currentIndex = availableWeeks.findIndex(
    (week) => week.getTime() === weekStart.getTime(),
  );
  const prevWeekDate =
    currentIndex > 0 ? availableWeeks[currentIndex - 1] : null;
  const nextWeekDate =
    currentIndex >= 0 && currentIndex < availableWeeks.length - 1
      ? availableWeeks[currentIndex + 1]
      : null;

  const now = new Date();
  const todayKey = formatDateKey(startOfDay(now));
  const focusKey = formatDateKey(getNextReservableDate(now, cutoffTime));

  const locationOptions = deliveryLocations.map((location) => ({
    id: location.id,
    title: location.title,
  }));

  const fallbackLocationId = deliveryLocations.some(
    (location) => location.id === user.deliveryLocationId,
  )
    ? user.deliveryLocationId
    : (deliveryLocations[0]?.id ?? user.deliveryLocationId);

  const reservedDates = new Set(
    reservations.map((reservation) => formatDateKey(reservation.date)),
  );

  const boardDays: ReserveDay[] = days.map(({ date, editable }) => {
    const dateKey = formatDateKey(date);
    const labels = persianDayParts(date);
    const deadline = getReservationDeadline(date, cutoffTime);
    const deadlineText = deadlineLabels(deadline);
    const status = !editable
      ? "closed"
      : reservedDates.has(dateKey)
        ? "reserved"
        : "open";

    return {
      dateKey,
      weekday: dateKey === todayKey ? "امروز" : labels.weekday,
      dayNumber: labels.dayNumber,
      menuTitle: labels.menuTitle,
      isToday: dateKey === todayKey,
      editable,
      status,
      deadlineIso: deadline.toISOString(),
      deadlineDateLabel: deadlineText.dateLabel,
      deadlineTimeLabel: deadlineText.timeLabel,
      periods: mealPeriods.map((period) => {
        const foods = menuItems.filter(
          (item) =>
            formatDateKey(item.date) === dateKey &&
            item.mealPeriodId === period.id,
        );
        const current = reservationBySlot.get(`${dateKey}:${period.id}`);
        return {
          id: period.id,
          title: period.title,
          servingLabel: `سرو ${formatClock(period.startTime)} تا ${formatClock(period.endTime)}`,
          quantityInputId: `quantity-${dateKey}-${period.id}`,
          foods: foods.map((item) => ({
            id: item.id,
            foodId: item.foodId,
            title: item.food.title,
            description: item.food.description,
            kind: item.food.kind,
          })),
          selectedFoodId: current?.foodId,
          selectedDrinkMenuItemId: current?.drinkMenuItemId,
          selectedSideMenuItemId: current?.sideMenuItemId,
          reservationId: current?.id,
          quantity: current?.quantity ?? 1,
          defaultDeliveryLocationId:
            current?.deliveryLocationId ?? fallbackLocationId,
          deliveryLocationTitle: current?.deliveryLocation.title ?? null,
        };
      }),
    };
  });

  return (
    <div className="mx-auto w-full max-w-md">
      {availableWeeks.length === 0 ? (
        <p className="text-booking-secondary text-sm">
          هنوز منویی برای نمایش ثبت نشده است.
        </p>
      ) : (
        <ReserveBoard
          key={formatDateKey(weekStart)}
          days={boardDays}
          initialDateKey={initialDateKeyFor(boardDays, focusKey)}
          nowIso={now.toISOString()}
          prevWeekHref={
            prevWeekDate ? `/menu?week=${formatDateKey(prevWeekDate)}` : null
          }
          nextWeekHref={
            nextWeekDate ? `/menu?week=${formatDateKey(nextWeekDate)}` : null
          }
          canSelectDeliveryLocation={canSelectDeliveryLocation}
          canSetQuantity={canSetQuantity}
          deliveryLocations={locationOptions}
        />
      )}
    </div>
  );
}
