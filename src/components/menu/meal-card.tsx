"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { cancelReservationAction, reserveMenuItemAction } from "@/app/actions";
import { FOOD_KINDS, type FoodKindValue } from "@/lib/meals/food-kind";
import { parseReservationQuantity } from "@/lib/meals/quantity";
import { cn } from "@/lib/utils";

export type DeliveryLocationOption = {
  id: string;
  title: string;
};

export type MenuFoodOption = {
  id: string;
  foodId: string;
  title: string;
  description: string | null;
  kind: FoodKindValue;
};

function FoodCard({
  title,
  description,
  selected,
  pending,
  disabled,
  onClick,
}: {
  title: string;
  description?: string | null;
  selected: boolean;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[10px] p-3 transition-all",
        selected
          ? "bg-booking-fill-soft shadow-[inset_0_0_0_1.5px_var(--booking-text)]"
          : "bg-transparent shadow-[inset_0_0_0_1px_var(--booking-line)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-booking text-[15px] leading-snug font-medium">
          {title}
        </p>
        {description ? (
          <p className="text-booking-secondary mt-0.5 text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "h-[38px] shrink-0 rounded-[10px] px-[18px] text-[13px] font-medium whitespace-nowrap transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
          selected
            ? "text-booking-cancel bg-white shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--booking-cancel)_35%,transparent)]"
            : "bg-booking-brand text-booking-on-brand shadow-[0_6px_18px_rgb(13_71_161/0.28)]",
        )}
      >
        {pending ? "…" : selected ? "لغو" : "ثبت"}
      </button>
    </div>
  );
}

function OrderSummary({
  periodTitle,
  lines,
}: {
  periodTitle: string;
  lines: { label: string; value: string }[];
}) {
  return (
    <div className="bg-booking-fill-soft flex flex-col gap-2.5 rounded-[10px] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-booking-heading text-xs font-semibold">
          خلاصه‌ی سفارش {periodTitle}
        </span>
        <span className="text-booking-reserved text-[11px] font-medium">
          ثبت شده
        </span>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
        {lines.map((line) => (
          <div key={line.label} className="contents">
            <dt className="text-booking-secondary whitespace-nowrap">
              {line.label}
            </dt>
            <dd className="text-booking font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export type MealCardCommit = {
  menuItemId: string;
  deliveryLocationId: string | null;
  drinkMenuItemId: string | null;
  sideMenuItemId: string | null;
  quantity: number;
};

function statusLabel(editable: boolean, reserved: boolean) {
  if (!editable) {
    return {
      label: "گذشته یا بسته",
      dot: "bg-booking-fill",
      text: "text-booking-secondary",
    };
  }
  if (reserved) {
    return {
      label: "رزرو شده",
      dot: "bg-booking-reserved",
      text: "text-booking-reserved",
    };
  }
  return {
    label: "قابل رزرو",
    dot: "bg-booking-brand",
    text: "text-booking-brand",
  };
}

export function MealCard({
  periodTitle,
  servingLabel,
  quantityInputId,
  foods,
  editable,
  selectedFoodId,
  selectedDrinkMenuItemId,
  selectedSideMenuItemId,
  reservationId,
  canSelectDeliveryLocation,
  canSetQuantity,
  quantity: selectedQuantity,
  deliveryLocations,
  defaultDeliveryLocationId,
  deliveryLocationTitle,
  onCommit,
  onCancelReservation,
}: {
  periodTitle: string;
  servingLabel: string;
  quantityInputId: string;
  foods: MenuFoodOption[];
  editable: boolean;
  selectedFoodId?: string;
  selectedDrinkMenuItemId?: string | null;
  selectedSideMenuItemId?: string | null;
  reservationId?: string;
  canSelectDeliveryLocation: boolean;
  canSetQuantity: boolean;
  quantity?: number;
  deliveryLocations: DeliveryLocationOption[];
  defaultDeliveryLocationId: string;
  deliveryLocationTitle?: string | null;
  onCommit?: (input: MealCardCommit) => Promise<void>;
  onCancelReservation?: () => Promise<void>;
}) {
  const [locationId, setLocationId] = useState(defaultDeliveryLocationId);
  const [drinkId, setDrinkId] = useState(selectedDrinkMenuItemId ?? "");
  const [sideId, setSideId] = useState(selectedSideMenuItemId ?? "");
  const [quantity, setQuantity] = useState(selectedQuantity ?? 1);
  const [seenQuantity, setSeenQuantity] = useState(selectedQuantity);
  const [reservePending, startReserve] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [seenLocationId, setSeenLocationId] = useState(
    defaultDeliveryLocationId,
  );
  const [seenDrinkId, setSeenDrinkId] = useState(selectedDrinkMenuItemId ?? "");
  const [seenSideId, setSeenSideId] = useState(selectedSideMenuItemId ?? "");
  const savedQuantity = selectedQuantity ?? 1;
  const quantityLabel = new Intl.NumberFormat("fa-IR").format(quantity);
  const drinkFromServer = selectedDrinkMenuItemId ?? "";
  const sideFromServer = selectedSideMenuItemId ?? "";

  if (selectedQuantity !== seenQuantity) {
    setSeenQuantity(selectedQuantity);
    setQuantity(selectedQuantity ?? 1);
  }

  if (defaultDeliveryLocationId !== seenLocationId) {
    setSeenLocationId(defaultDeliveryLocationId);
    setLocationId(defaultDeliveryLocationId);
  }

  if (drinkFromServer !== seenDrinkId) {
    setSeenDrinkId(drinkFromServer);
    setDrinkId(drinkFromServer);
  }

  if (sideFromServer !== seenSideId) {
    setSeenSideId(sideFromServer);
    setSideId(sideFromServer);
  }

  const mainFoods = foods.filter((item) => item.kind === FOOD_KINDS.MAIN);
  const drinks = foods.filter((item) => item.kind === FOOD_KINDS.DRINK);
  const sides = foods.filter((item) => item.kind === FOOD_KINDS.YOGURT_SALAD);
  const mainMenuItemId = mainFoods.find(
    (item) => item.foodId === selectedFoodId,
  )?.id;
  const status = statusLabel(editable, Boolean(reservationId));

  function revertLocalChoices() {
    setDrinkId(selectedDrinkMenuItemId ?? "");
    setSideId(selectedSideMenuItemId ?? "");
    setLocationId(defaultDeliveryLocationId);
    setQuantity(savedQuantity);
  }

  const commitReservation = useCallback(
    async (
      nextMainMenuItemId: string,
      nextLocationId: string,
      nextDrinkId: string,
      nextSideId: string,
      nextQuantity: number,
    ) => {
      const deliveryLocationId = canSelectDeliveryLocation
        ? nextLocationId
        : null;
      const drinkMenuItemId = nextDrinkId || null;
      const sideMenuItemId = nextSideId || null;
      if (onCommit) {
        await onCommit({
          menuItemId: nextMainMenuItemId,
          deliveryLocationId,
          drinkMenuItemId,
          sideMenuItemId,
          quantity: nextQuantity,
        });
        return;
      }
      await reserveMenuItemAction(
        nextMainMenuItemId,
        deliveryLocationId,
        drinkMenuItemId,
        sideMenuItemId,
        canSetQuantity ? nextQuantity : null,
      );
    },
    [canSelectDeliveryLocation, canSetQuantity, onCommit],
  );

  function save(
    nextMainMenuItemId: string,
    nextDrinkId: string,
    nextSideId: string,
    nextQuantity: number,
    nextLocationId = locationId,
  ) {
    startReserve(async () => {
      try {
        await commitReservation(
          nextMainMenuItemId,
          nextLocationId,
          nextDrinkId,
          nextSideId,
          nextQuantity,
        );
      } catch {
        revertLocalChoices();
      }
    });
  }

  useEffect(() => {
    if (!canSetQuantity || !editable || quantity === savedQuantity) return;
    if (!mainMenuItemId) return;
    const timer = setTimeout(() => {
      startReserve(async () => {
        try {
          await commitReservation(
            mainMenuItemId,
            locationId,
            drinkId,
            sideId,
            quantity,
          );
        } catch {
          setQuantity(savedQuantity);
        }
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [
    quantity,
    savedQuantity,
    canSetQuantity,
    editable,
    canSelectDeliveryLocation,
    startReserve,
    mainMenuItemId,
    locationId,
    drinkId,
    sideId,
    commitReservation,
  ]);

  function selectAddon(kind: "drink" | "side", menuItemId: string) {
    const nextDrinkId = kind === "drink" ? menuItemId : drinkId;
    const nextSideId = kind === "side" ? menuItemId : sideId;
    if (kind === "drink") setDrinkId(menuItemId);
    else setSideId(menuItemId);
    if (mainMenuItemId) {
      save(mainMenuItemId, nextDrinkId, nextSideId, quantity);
    }
  }

  function setClampedQuantity(next: number) {
    setQuantity(parseReservationQuantity(next));
  }

  function cancelReservation() {
    if (!reservationId) return;
    startCancel(async () => {
      if (onCancelReservation) {
        await onCancelReservation();
        return;
      }
      await cancelReservationAction(reservationId);
    });
  }

  const busy = reservePending || cancelPending;
  const selectedFood = mainFoods.find((item) => item.foodId === selectedFoodId);
  const selectedDrink = drinks.find((item) => item.id === drinkId);
  const selectedSide = sides.find((item) => item.id === sideId);
  const locationTitle =
    deliveryLocations.find((location) => location.id === locationId)?.title ??
    deliveryLocationTitle ??
    "—";

  return (
    <section className="rounded-xl bg-white shadow-[0_0_0_1px_var(--booking-line),0_8px_24px_rgb(0_0_0/0.05)]">
      <div className="flex items-center justify-between gap-3 px-[18px] py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-booking-heading text-xl font-semibold tracking-tight">
              {periodTitle}
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs whitespace-nowrap",
                status.text,
              )}
            >
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
          </div>
          <p className="text-booking-secondary text-xs whitespace-nowrap">
            {servingLabel}
          </p>
        </div>
        {canSetQuantity ? (
          <div className="bg-booking-fill-soft flex shrink-0 items-center gap-2 rounded-xl p-1">
            <button
              type="button"
              aria-label="افزایش تعداد"
              disabled={!editable || busy}
              onClick={() => setClampedQuantity(quantity + 1)}
              className="bg-booking text-booking-on-brand flex size-[34px] items-center justify-center rounded-[9px] text-lg active:scale-90 disabled:opacity-50"
            >
              +
            </button>
            <span
              id={quantityInputId}
              className="text-booking min-w-11 text-center text-sm font-semibold whitespace-nowrap"
            >
              {quantityLabel} پرس
            </span>
            <button
              type="button"
              aria-label="کاهش تعداد"
              disabled={!editable || busy}
              onClick={() => setClampedQuantity(quantity - 1)}
              className="text-booking-secondary flex size-[34px] items-center justify-center rounded-[9px] bg-white text-lg active:scale-90 disabled:opacity-50"
            >
              −
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-booking-line flex flex-col gap-[18px] border-t px-[18px] pt-3.5 pb-[18px]">
        {canSelectDeliveryLocation && deliveryLocations.length > 0 ? (
          <label className="flex min-w-0 items-center gap-2.5">
            <span className="text-booking-secondary shrink-0 text-xs whitespace-nowrap">
              محل تحویل
            </span>
            <select
              value={locationId}
              disabled={!editable}
              onChange={(event) => {
                const nextLocationId = event.target.value;
                setLocationId(nextLocationId);
                if (mainMenuItemId) {
                  save(
                    mainMenuItemId,
                    drinkId,
                    sideId,
                    quantity,
                    nextLocationId,
                  );
                }
              }}
              className="bg-booking-fill-soft text-booking h-11 min-w-0 flex-1 rounded-[10px] border-none px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-brand)]/30 disabled:opacity-50"
            >
              {deliveryLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {mainFoods.length === 0 ? (
          <p className="text-booking-secondary text-xs">غذایی ثبت نشده</p>
        ) : (
          <div className="flex flex-col gap-2">
            {mainFoods.map((item) => {
              const selected = selectedFoodId === item.foodId;
              return (
                <FoodCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  selected={selected}
                  pending={busy}
                  disabled={!editable || busy || (selected && !reservationId)}
                  onClick={() => {
                    if (selected) cancelReservation();
                    else save(item.id, drinkId, sideId, quantity);
                  }}
                />
              );
            })}
          </div>
        )}

        {drinks.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-booking-heading text-sm font-semibold">
              نوشیدنی
            </p>
            {drinks.map((item) => {
              const selected = drinkId === item.id;
              return (
                <FoodCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  selected={selected}
                  pending={busy}
                  disabled={!editable || busy}
                  onClick={() => selectAddon("drink", selected ? "" : item.id)}
                />
              );
            })}
          </div>
        ) : null}

        {sides.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-booking-heading text-sm font-semibold">
              ماست و سالاد
            </p>
            {sides.map((item) => {
              const selected = sideId === item.id;
              return (
                <FoodCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  selected={selected}
                  pending={busy}
                  disabled={!editable || busy}
                  onClick={() => selectAddon("side", selected ? "" : item.id)}
                />
              );
            })}
          </div>
        ) : null}

        {reservationId ? (
          <OrderSummary
            periodTitle={periodTitle}
            lines={[
              { label: "غذا", value: selectedFood?.title ?? "—" },
              { label: "تعداد", value: `${quantityLabel} پرس` },
              { label: "نوشیدنی", value: selectedDrink?.title ?? "—" },
              { label: "مخلفات", value: selectedSide?.title ?? "—" },
              { label: "محل تحویل", value: locationTitle },
            ]}
          />
        ) : null}
      </div>
    </section>
  );
}
