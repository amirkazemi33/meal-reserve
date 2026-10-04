"use client";

import { useState } from "react";
import { DayStatusLegend } from "@/components/menu/day-status-legend";
import { DayStrip, type DayStatus } from "@/components/menu/day-strip";
import {
  MealCard,
  type DeliveryLocationOption,
  type MenuFoodOption,
} from "@/components/menu/meal-card";
import { ReservationDeadline } from "@/components/menu/reservation-deadline";
import { FOOD_KINDS } from "@/lib/meals/food-kind";

export type { DayStatus };

export type ReservePeriod = {
  id: string;
  title: string;
  servingLabel: string;
  quantityInputId: string;
  foods: MenuFoodOption[];
  selectedFoodId?: string;
  selectedDrinkMenuItemId?: string | null;
  selectedSideMenuItemId?: string | null;
  reservationId?: string;
  quantity?: number;
  defaultDeliveryLocationId: string;
  deliveryLocationTitle?: string | null;
};

export type ReserveDay = {
  dateKey: string;
  weekday: string;
  dayNumber: string;
  menuTitle: string;
  isToday: boolean;
  editable: boolean;
  status: DayStatus;
  deadlineIso: string;
  deadlineDateLabel: string;
  deadlineTimeLabel: string;
  periods: ReservePeriod[];
};

export function ReserveBoard({
  days,
  initialDateKey,
  nowIso,
  prevWeekHref,
  nextWeekHref,
  canSelectDeliveryLocation,
  canSetQuantity,
  deliveryLocations,
}: {
  days: ReserveDay[];
  initialDateKey: string;
  nowIso: string;
  prevWeekHref: string | null;
  nextWeekHref: string | null;
  canSelectDeliveryLocation: boolean;
  canSetQuantity: boolean;
  deliveryLocations: DeliveryLocationOption[];
}) {
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const selected =
    days.find((day) => day.dateKey === selectedDateKey) ?? days[0];

  if (!selected) return null;

  const visiblePeriods = selected.periods.filter(
    (period) =>
      period.foods.some((item) => item.kind === FOOD_KINDS.MAIN) ||
      Boolean(period.reservationId),
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <section className="flex flex-col gap-2">
        <DayStrip
          days={days}
          selectedDateKey={selected.dateKey}
          onSelect={setSelectedDateKey}
          prevWeekHref={prevWeekHref}
          nextWeekHref={nextWeekHref}
        />
        <DayStatusLegend />
      </section>

      <ReservationDeadline
        deadlineIso={selected.deadlineIso}
        nowIso={nowIso}
        dateLabel={selected.deadlineDateLabel}
        timeLabel={selected.deadlineTimeLabel}
      />

      <h2 className="text-booking-heading pt-1 text-[19px] font-semibold tracking-tight">
        {selected.menuTitle}
      </h2>

      <div className="flex flex-col gap-3">
        {visiblePeriods.length === 0 ? (
          <p className="text-booking-secondary text-sm">
            برای این روز غذایی ثبت نشده است.
          </p>
        ) : (
          visiblePeriods.map((period) => (
            <MealCard
              key={`${selected.dateKey}-${period.id}`}
              periodTitle={period.title}
              servingLabel={period.servingLabel}
              quantityInputId={period.quantityInputId}
              foods={period.foods}
              editable={selected.editable}
              selectedFoodId={period.selectedFoodId}
              selectedDrinkMenuItemId={period.selectedDrinkMenuItemId}
              selectedSideMenuItemId={period.selectedSideMenuItemId}
              reservationId={period.reservationId}
              canSelectDeliveryLocation={canSelectDeliveryLocation}
              canSetQuantity={canSetQuantity}
              quantity={period.quantity}
              deliveryLocations={deliveryLocations}
              defaultDeliveryLocationId={period.defaultDeliveryLocationId}
              deliveryLocationTitle={period.deliveryLocationTitle}
            />
          ))
        )}
      </div>
    </div>
  );
}
