"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cancelReservationAction, reserveMenuItemAction } from "@/app/actions";
import { FOOD_KINDS, type FoodKindValue } from "@/lib/meals/food-kind";
import { ReservationQuantityInput } from "@/components/menu/reservation-quantity-input";

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

function ChoiceList({
  title,
  noneLabel,
  items,
  selectedId,
  editable,
  pending,
  onSelect,
}: {
  title: string;
  noneLabel: string;
  items: MenuFoodOption[];
  selectedId: string;
  editable: boolean;
  pending: boolean;
  onSelect: (menuItemId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      <ul className="space-y-2">
        <li
          className={
            selectedId === ""
              ? "border-primary/25 bg-primary/10 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              : "border-transparent bg-muted/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          }
        >
          <p className="text-sm">{noneLabel}</p>
          <Button
            type="button"
            size="sm"
            variant={selectedId === "" ? "default" : "outline"}
            disabled={!editable || pending}
            className="shrink-0"
            onClick={() => onSelect("")}
          >
            {selectedId === "" ? "انتخاب‌شده" : "انتخاب"}
          </Button>
        </li>
        {items.map((item) => {
          const selected = selectedId === item.id;
          return (
            <li
              key={item.id}
              className={
                selected
                  ? "border-primary/25 bg-primary/10 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  : "border-transparent bg-muted/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              }
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description ? (
                  <p className="text-muted-foreground truncate text-xs">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                disabled={!editable || pending}
                className="shrink-0"
                onClick={() => onSelect(item.id)}
              >
                {pending ? "…" : selected ? "انتخاب‌شده" : "انتخاب"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MealPeriodReserveBlock({
  periodTitle,
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
}: {
  periodTitle: string;
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
}) {
  const [locationId, setLocationId] = useState(defaultDeliveryLocationId);
  const [drinkId, setDrinkId] = useState(selectedDrinkMenuItemId ?? "");
  const [sideId, setSideId] = useState(selectedSideMenuItemId ?? "");
  const [quantity, setQuantity] = useState(selectedQuantity ?? 1);
  const [seenQuantity, setSeenQuantity] = useState(selectedQuantity);
  const [reservePending, startReserve] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const savedQuantity = selectedQuantity ?? 1;

  if (selectedQuantity !== seenQuantity) {
    setSeenQuantity(selectedQuantity);
    setQuantity(selectedQuantity ?? 1);
  }

  useEffect(() => {
    setDrinkId(selectedDrinkMenuItemId ?? "");
  }, [selectedDrinkMenuItemId]);

  useEffect(() => {
    setSideId(selectedSideMenuItemId ?? "");
  }, [selectedSideMenuItemId]);

  const mainFoods = foods.filter((item) => item.kind === FOOD_KINDS.MAIN);
  const drinks = foods.filter((item) => item.kind === FOOD_KINDS.DRINK);
  const sides = foods.filter((item) => item.kind === FOOD_KINDS.YOGURT_SALAD);
  const mainMenuItemId = mainFoods.find(
    (item) => item.foodId === selectedFoodId,
  )?.id;

  function save(
    nextMainMenuItemId: string,
    nextDrinkId: string,
    nextSideId: string,
    nextQuantity: number,
  ) {
    startReserve(async () => {
      await reserveMenuItemAction(
        nextMainMenuItemId,
        canSelectDeliveryLocation ? locationId : null,
        nextDrinkId || null,
        nextSideId || null,
        canSetQuantity ? nextQuantity : null,
      );
    });
  }

  useEffect(() => {
    if (!canSetQuantity || !editable || quantity === savedQuantity) return;
    if (!mainMenuItemId) return;
    const timer = setTimeout(() => {
      startReserve(async () => {
        await reserveMenuItemAction(
          mainMenuItemId,
          canSelectDeliveryLocation ? locationId : null,
          drinkId || null,
          sideId || null,
          quantity,
        );
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tracking-wide">{periodTitle}</p>
          {canSetQuantity ? (
            <ReservationQuantityInput
              id={quantityInputId}
              value={quantity}
              disabled={!editable || reservePending}
              onChange={setQuantity}
            />
          ) : null}
        </div>
        {reservationId ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!editable || cancelPending}
            onClick={() => {
              startCancel(async () => {
                await cancelReservationAction(reservationId);
              });
            }}
          >
            {cancelPending ? "…" : "لغو"}
          </Button>
        ) : null}
      </div>

      {canSelectDeliveryLocation && deliveryLocations.length > 0 ? (
        <div className="space-y-1">
          <Label className="text-xs">محل تحویل</Label>
          <select
            value={locationId}
            disabled={!editable}
            onChange={(e) => setLocationId(e.target.value)}
            className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {deliveryLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {mainFoods.length === 0 ? (
        <p className="text-muted-foreground text-xs">غذایی ثبت نشده</p>
      ) : (
        <ul className="space-y-2">
          {mainFoods.map((item) => {
            const selected = selectedFoodId === item.foodId;
            return (
              <li
                key={item.id}
                className={
                  selected
                    ? "border-primary/25 bg-primary/10 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    : "border-transparent bg-muted/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  disabled={!editable || reservePending}
                  className="shrink-0"
                  onClick={() => save(item.id, drinkId, sideId, quantity)}
                >
                  {reservePending ? "…" : selected ? "انتخاب‌شده" : "انتخاب"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ChoiceList
        title="نوشیدنی"
        noneLabel="بدون نوشیدنی"
        items={drinks}
        selectedId={drinkId}
        editable={editable}
        pending={reservePending}
        onSelect={(menuItemId) => selectAddon("drink", menuItemId)}
      />
      <ChoiceList
        title="ماست و سالاد"
        noneLabel="بدون ماست و سالاد"
        items={sides}
        selectedId={sideId}
        editable={editable}
        pending={reservePending}
        onSelect={(menuItemId) => selectAddon("side", menuItemId)}
      />
    </div>
  );
}
