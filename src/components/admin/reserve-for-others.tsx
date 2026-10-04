"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FunnelX, ListFilterPlus } from "lucide-react";

import { reserveForOthersAction } from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOOD_KINDS, type FoodKindValue } from "@/lib/meals/food-kind";
import { parseReservationQuantity } from "@/lib/meals/quantity";
import { cn } from "@/lib/utils";

export type ReserveForUserOption = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  deliveryLocationId: string | null;
};

export type ReserveForUserListOption = {
  id: string;
  title: string;
  memberUserIds: string[];
};

export type ReserveForMenuFood = {
  menuItemId: string;
  foodId: string;
  title: string;
  description: string | null;
  kind: FoodKindValue;
};

export type ReserveForMenuPeriod = {
  id: string;
  title: string;
  servingLabel: string;
  foods: ReserveForMenuFood[];
};

type PeriodSelection = {
  mainMenuItemId: string;
  drinkMenuItemId: string;
  sideMenuItemId: string;
};

type MealDraft = {
  selections: Record<string, PeriodSelection>;
  quantity: number;
  locationId: string;
};

type TargetMode = "users" | "list";
type MealMode = "shared" | "per_user";

type ReserveForOthersProps = {
  dateKey: string;
  displayDate: string;
  editable: boolean;
  cutoffTime: string;
  mealPeriods: ReserveForMenuPeriod[];
  users: ReserveForUserOption[];
  userLists: ReserveForUserListOption[];
  canUseUserLists: boolean;
  canSelectDeliveryLocation: boolean;
  canSetQuantity: boolean;
  deliveryLocations: { id: string; title: string }[];
};

function emptySelections(mealPeriods: ReserveForMenuPeriod[]) {
  return Object.fromEntries(
    mealPeriods.map((period) => [
      period.id,
      { mainMenuItemId: "", drinkMenuItemId: "", sideMenuItemId: "" },
    ]),
  ) as Record<string, PeriodSelection>;
}

function createMealDraft(
  mealPeriods: ReserveForMenuPeriod[],
  locationId = "",
): MealDraft {
  return {
    selections: emptySelections(mealPeriods),
    quantity: 1,
    locationId,
  };
}

function resolveUserDefaultLocationId(
  user: ReserveForUserOption,
  deliveryLocations: { id: string; title: string }[],
) {
  if (
    user.deliveryLocationId &&
    deliveryLocations.some(
      (location) => location.id === user.deliveryLocationId,
    )
  ) {
    return user.deliveryLocationId;
  }
  return deliveryLocations[0]?.id ?? "";
}

function periodSelectionsFromDraft(draft: MealDraft) {
  return Object.values(draft.selections)
    .filter((selection) => Boolean(selection.mainMenuItemId))
    .map((selection) => ({
      menuItemId: selection.mainMenuItemId,
      drinkMenuItemId: selection.drinkMenuItemId || null,
      sideMenuItemId: selection.sideMenuItemId || null,
    }));
}

function draftHasSelection(draft: MealDraft) {
  return Object.values(draft.selections).some((selection) =>
    Boolean(selection.mainMenuItemId),
  );
}

function periodStatus(editable: boolean, selected: boolean) {
  if (!editable) {
    return {
      label: "گذشته یا بسته",
      dot: "bg-booking-fill",
      text: "text-booking-secondary",
    };
  }
  if (selected) {
    return {
      label: "انتخاب شده",
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

function BookingFoodRow({
  title,
  description,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description?: string | null;
  selected: boolean;
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
        {selected ? "لغو" : "ثبت"}
      </button>
    </div>
  );
}

function BookingChoiceList({
  title,
  items,
  selectedId,
  disabled,
  onSelect,
}: {
  title: string;
  items: ReserveForMenuFood[];
  selectedId: string;
  disabled: boolean;
  onSelect: (menuItemId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-booking-heading text-sm font-semibold">{title}</p>
      {items.map((item) => {
        const selected = selectedId === item.menuItemId;
        return (
          <BookingFoodRow
            key={item.menuItemId}
            title={item.title}
            description={item.description}
            selected={selected}
            disabled={disabled}
            onClick={() => onSelect(selected ? "" : item.menuItemId)}
          />
        );
      })}
    </div>
  );
}

function MealDraftEditor({
  title,
  description,
  draft,
  mealPeriods,
  editable,
  pending,
  canSetQuantity,
  showQuantity = true,
  canSelectDeliveryLocation,
  deliveryLocations,
  quantityInputId,
  defaultLocationLabel,
  showDefaultLocationOption = false,
  onChange,
}: {
  title: string;
  description?: string;
  draft: MealDraft;
  mealPeriods: ReserveForMenuPeriod[];
  editable: boolean;
  pending: boolean;
  canSetQuantity: boolean;
  showQuantity?: boolean;
  canSelectDeliveryLocation: boolean;
  deliveryLocations: { id: string; title: string }[];
  quantityInputId: string;
  defaultLocationLabel?: string;
  showDefaultLocationOption?: boolean;
  onChange: (patch: Partial<MealDraft>) => void;
}) {
  function updatePeriod(periodId: string, patch: Partial<PeriodSelection>) {
    onChange({
      selections: {
        ...draft.selections,
        [periodId]: {
          ...(draft.selections[periodId] ?? {
            mainMenuItemId: "",
            drinkMenuItemId: "",
            sideMenuItemId: "",
          }),
          ...patch,
        },
      },
    });
  }

  const quantityLabel = new Intl.NumberFormat("fa-IR").format(draft.quantity);
  const locationTitle =
    deliveryLocations.find((location) => location.id === draft.locationId)
      ?.title ??
    (showDefaultLocationOption
      ? (defaultLocationLabel ?? "پیش‌فرض کاربر")
      : "—");
  const controlsDisabled = !editable || pending;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-booking-heading text-base font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="text-booking-secondary text-xs">{description}</p>
        ) : null}
      </div>

      {mealPeriods.length === 0 ? (
        <p className="text-booking-secondary text-sm">
          برای این تاریخ منویی ثبت نشده است.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {mealPeriods.map((period) => {
            const selection = draft.selections[period.id] ?? {
              mainMenuItemId: "",
              drinkMenuItemId: "",
              sideMenuItemId: "",
            };
            const mains = period.foods.filter(
              (food) => food.kind === FOOD_KINDS.MAIN,
            );
            const drinks = period.foods.filter(
              (food) => food.kind === FOOD_KINDS.DRINK,
            );
            const sides = period.foods.filter(
              (food) => food.kind === FOOD_KINDS.YOGURT_SALAD,
            );
            const selectedMain = mains.find(
              (item) => item.menuItemId === selection.mainMenuItemId,
            );
            const selectedDrink = drinks.find(
              (item) => item.menuItemId === selection.drinkMenuItemId,
            );
            const selectedSide = sides.find(
              (item) => item.menuItemId === selection.sideMenuItemId,
            );
            const status = periodStatus(editable, Boolean(selectedMain));

            return (
              <section
                key={period.id}
                className="rounded-xl bg-white shadow-[0_0_0_1px_var(--booking-line),0_8px_24px_rgb(0_0_0/0.05)]"
              >
                <div className="flex items-center justify-between gap-3 px-[18px] py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-booking-heading text-xl font-semibold tracking-tight">
                        {period.title}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-xs whitespace-nowrap",
                          status.text,
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", status.dot)}
                        />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-booking-secondary text-xs whitespace-nowrap">
                      {period.servingLabel}
                    </p>
                  </div>
                  {canSetQuantity && showQuantity ? (
                    <div className="bg-booking-fill-soft flex shrink-0 items-center gap-2 rounded-xl p-1">
                      <button
                        type="button"
                        aria-label="افزایش تعداد"
                        disabled={controlsDisabled}
                        onClick={() =>
                          onChange({
                            quantity: parseReservationQuantity(
                              draft.quantity + 1,
                            ),
                          })
                        }
                        className="bg-booking text-booking-on-brand flex size-[34px] items-center justify-center rounded-[9px] text-lg active:scale-90 disabled:opacity-50"
                      >
                        +
                      </button>
                      <span
                        id={`${quantityInputId}-${period.id}`}
                        className="text-booking min-w-11 text-center text-sm font-semibold whitespace-nowrap"
                      >
                        {quantityLabel} پرس
                      </span>
                      <button
                        type="button"
                        aria-label="کاهش تعداد"
                        disabled={controlsDisabled}
                        onClick={() =>
                          onChange({
                            quantity: parseReservationQuantity(
                              draft.quantity - 1,
                            ),
                          })
                        }
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
                        value={draft.locationId}
                        disabled={controlsDisabled}
                        onChange={(event) =>
                          onChange({ locationId: event.target.value })
                        }
                        className="bg-booking-fill-soft text-booking h-11 min-w-0 flex-1 rounded-[10px] border-none px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-brand)]/30 disabled:opacity-50"
                      >
                        {showDefaultLocationOption ? (
                          <option value="">
                            {defaultLocationLabel ?? "پیش‌فرض کاربر"}
                          </option>
                        ) : null}
                        {deliveryLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {mains.length === 0 ? (
                    <p className="text-booking-secondary text-xs">
                      غذایی ثبت نشده
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {mains.map((item) => {
                        const selected =
                          selection.mainMenuItemId === item.menuItemId;
                        return (
                          <BookingFoodRow
                            key={item.menuItemId}
                            title={item.title}
                            description={item.description}
                            selected={selected}
                            disabled={controlsDisabled}
                            onClick={() =>
                              updatePeriod(period.id, {
                                mainMenuItemId: selected ? "" : item.menuItemId,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  )}

                  <BookingChoiceList
                    title="نوشیدنی"
                    items={drinks}
                    selectedId={selection.drinkMenuItemId}
                    disabled={controlsDisabled}
                    onSelect={(menuItemId) =>
                      updatePeriod(period.id, { drinkMenuItemId: menuItemId })
                    }
                  />
                  <BookingChoiceList
                    title="ماست و سالاد"
                    items={sides}
                    selectedId={selection.sideMenuItemId}
                    disabled={controlsDisabled}
                    onSelect={(menuItemId) =>
                      updatePeriod(period.id, { sideMenuItemId: menuItemId })
                    }
                  />

                  {selectedMain ? (
                    <div className="bg-booking-fill-soft flex flex-col gap-2.5 rounded-[10px] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-booking-heading text-xs font-semibold">
                          خلاصه‌ی سفارش {period.title}
                        </span>
                        <span className="text-booking-reserved text-[11px] font-medium">
                          انتخاب شده
                        </span>
                      </div>
                      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
                        {(
                          [
                            { label: "غذا", value: selectedMain.title },
                            ...(canSetQuantity && showQuantity
                              ? [
                                  {
                                    label: "تعداد",
                                    value: `${quantityLabel} پرس`,
                                  },
                                ]
                              : []),
                            {
                              label: "نوشیدنی",
                              value: selectedDrink?.title ?? "—",
                            },
                            {
                              label: "مخلفات",
                              value: selectedSide?.title ?? "—",
                            },
                            ...(canSelectDeliveryLocation
                              ? [{ label: "محل تحویل", value: locationTitle }]
                              : []),
                          ] as { label: string; value: string }[]
                        ).map((line) => (
                          <div key={line.label} className="contents">
                            <dt className="text-booking-secondary whitespace-nowrap">
                              {line.label}
                            </dt>
                            <dd className="text-booking font-medium">
                              {line.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReserveForOthers({
  dateKey,
  displayDate,
  editable,
  cutoffTime,
  mealPeriods,
  users,
  userLists,
  canUseUserLists,
  canSelectDeliveryLocation,
  canSetQuantity,
  deliveryLocations,
}: ReserveForOthersProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(dateKey);
  const [targetMode, setTargetMode] = useState<TargetMode>("users");
  const [mealMode, setMealMode] = useState<MealMode>("shared");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedListId, setSelectedListId] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sharedDraft, setSharedDraft] = useState<MealDraft>(() =>
    createMealDraft(mealPeriods),
  );
  const [perUserDrafts, setPerUserDrafts] = useState<Record<string, MealDraft>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const nameQ = nameSearch.trim().toLowerCase();
    const lastNameQ = lastNameSearch.trim().toLowerCase();
    const phoneQ = phoneSearch.trim();
    return users.filter((user) => {
      if (nameQ && !user.name.toLowerCase().includes(nameQ)) return false;
      if (lastNameQ && !user.lastName.toLowerCase().includes(lastNameQ)) {
        return false;
      }
      if (phoneQ && !user.phone.includes(phoneQ)) return false;
      return true;
    });
  }, [users, nameSearch, lastNameSearch, phoneSearch]);

  const selectedList = userLists.find((list) => list.id === selectedListId);
  const listMemberIds = useMemo(() => {
    if (!selectedList) return [];
    return selectedList.memberUserIds.filter((id) => usersById.has(id));
  }, [selectedList, usersById]);

  const targetUserIds =
    targetMode === "list" ? listMemberIds : [...selectedUserIds];

  const targetUsers = targetUserIds
    .map((id) => usersById.get(id))
    .filter((user): user is ReserveForUserOption => Boolean(user));

  const targetUserIdsKey = targetUserIds.join(",");

  useEffect(() => {
    if (mealMode !== "per_user") return;
    const ids = targetUserIdsKey ? targetUserIdsKey.split(",") : [];
    setPerUserDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const userId of ids) {
        if (!next[userId]) {
          const user = usersById.get(userId);
          next[userId] = createMealDraft(
            mealPeriods,
            user
              ? resolveUserDefaultLocationId(user, deliveryLocations)
              : (deliveryLocations[0]?.id ?? ""),
          );
          changed = true;
        }
      }
      for (const userId of Object.keys(next)) {
        if (!ids.includes(userId)) {
          delete next[userId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [mealMode, targetUserIdsKey, mealPeriods, usersById, deliveryLocations]);

  const canSubmit =
    targetUserIds.length > 0 &&
    editable &&
    (mealMode === "shared"
      ? draftHasSelection(sharedDraft)
      : targetUserIds.some((userId) => {
          const draft = perUserDrafts[userId];
          return draft ? draftHasSelection(draft) : false;
        }));

  function handleDateChange(date: string | string[]) {
    const next = typeof date === "string" ? date : (date[0] ?? "");
    setSelectedDate(next);
    if (!next || next === dateKey) return;
    router.push(`/admin/reserve-for?date=${encodeURIComponent(next)}`);
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function patchSharedDraft(patch: Partial<MealDraft>) {
    setSharedDraft((prev) => ({ ...prev, ...patch }));
  }

  function draftForUser(user: ReserveForUserOption) {
    return (
      perUserDrafts[user.id] ??
      createMealDraft(
        mealPeriods,
        resolveUserDefaultLocationId(user, deliveryLocations),
      )
    );
  }

  function patchUserDraft(userId: string, patch: Partial<MealDraft>) {
    const user = usersById.get(userId);
    setPerUserDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ??
          createMealDraft(
            mealPeriods,
            user
              ? resolveUserDefaultLocationId(user, deliveryLocations)
              : (deliveryLocations[0]?.id ?? ""),
          )),
        ...patch,
      },
    }));
  }

  function resolveDeliveryLocationId(locationId: string) {
    if (!canSelectDeliveryLocation) return null;
    return locationId || null;
  }

  function submit() {
    setError(null);
    setSuccessMessage(null);

    if (targetUserIds.length === 0) {
      setError("حداقل یک کاربر یا لیست انتخاب کنید");
      return;
    }
    if (!editable) {
      setError("مهلت رزرو برای این تاریخ به پایان رسیده است");
      return;
    }

    const entries =
      mealMode === "shared"
        ? (() => {
            const selections = periodSelectionsFromDraft(sharedDraft);
            if (selections.length === 0) return [];
            return targetUserIds.map((userId) => ({
              userId,
              selections,
              deliveryLocationId: resolveDeliveryLocationId(
                sharedDraft.locationId,
              ),
              quantity: canSetQuantity ? sharedDraft.quantity : null,
            }));
          })()
        : targetUserIds
            .map((userId) => {
              const user = usersById.get(userId);
              if (!user) return null;
              const draft = draftForUser(user);
              const selections = periodSelectionsFromDraft(draft);
              if (selections.length === 0) return null;
              return {
                userId,
                selections,
                deliveryLocationId: resolveDeliveryLocationId(draft.locationId),
                quantity: canSetQuantity ? draft.quantity : null,
              };
            })
            .filter((entry): entry is NonNullable<typeof entry> =>
              Boolean(entry),
            );

    if (entries.length === 0) {
      setError(
        mealMode === "shared"
          ? "حداقل برای یک وعده غذای اصلی انتخاب کنید"
          : "حداقل برای یک کاربر غذای اصلی انتخاب کنید",
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await reserveForOthersAction({
          userIds: targetMode === "users" ? targetUserIds : undefined,
          userListId: targetMode === "list" ? selectedListId : null,
          entries,
        });

        if (result.failureCount === 0) {
          setSuccessMessage(
            `${result.successCount} رزرو برای ${entries.length} نفر ثبت شد.`,
          );
        } else {
          setError(
            `${result.successCount} رزرو موفق و ${result.failureCount} ناموفق. نمونه خطا: ${
              result.results.find((row) => !row.ok)?.error ?? "نامشخص"
            }`,
          );
          if (result.successCount > 0) {
            setSuccessMessage(`${result.successCount} رزرو با موفقیت ثبت شد.`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در ثبت رزرو");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label htmlFor="reserve-for-date" className="text-xs">
                تاریخ
              </Label>
              <div className="mt-1 w-full max-w-xs">
                <PersianDatePicker
                  id="reserve-for-date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                منوی {displayDate} · ضرب‌الاجل: {cutoffTime} روز قبل
              </p>
            </div>
            <Badge variant={editable ? "secondary" : "outline"}>
              {editable ? "قابل رزرو" : "مهلت تمام شده"}
            </Badge>
          </div>

          <div className="bg-muted/50 rounded-lg border px-3 py-2 text-sm">
            در حال رزرو برای{" "}
            <span className="font-medium">{targetUsers.length}</span> نفر
            {targetMode === "list" && selectedList ? (
              <> از لیست «{selectedList.title}»</>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={targetMode === "users" ? "default" : "outline"}
              onClick={() => setTargetMode("users")}
            >
              انتخاب کاربران
            </Button>
            {canUseUserLists ? (
              <Button
                type="button"
                size="sm"
                variant={targetMode === "list" ? "default" : "outline"}
                onClick={() => setTargetMode("list")}
              >
                انتخاب لیست
              </Button>
            ) : null}
          </div>

          {targetMode === "list" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">لیست کاربر</Label>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="border-input h-9 w-full max-w-md rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">انتخاب لیست…</option>
                  {userLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title} ({list.memberUserIds.length})
                    </option>
                  ))}
                </select>
              </div>
              {selectedListId && listMemberIds.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  این لیست عضو فعال ندارد.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFiltersOpen((open) => !open)}
                >
                  {filtersOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ListFilterPlus className="size-4" />
                  )}
                  فیلتر کاربران
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNameSearch("");
                    setLastNameSearch("");
                    setPhoneSearch("");
                  }}
                >
                  <FunnelX className="size-4" />
                  پاک کردن
                </Button>
              </div>

              {filtersOpen ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="نام"
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                  <Input
                    placeholder="نام خانوادگی"
                    value={lastNameSearch}
                    onChange={(e) => setLastNameSearch(e.target.value)}
                  />
                  <Input
                    placeholder="موبایل"
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                  />
                </div>
              ) : null}

              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-muted-foreground p-2 text-sm">
                    کاربری پیدا نشد.
                  </p>
                ) : (
                  filteredUsers.map((user) => {
                    const checked = selectedUserIds.has(user.id);
                    return (
                      <label
                        key={user.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm",
                          checked ? "bg-primary/10" : "hover:bg-muted/60",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleUser(user.id)}
                          className="size-4"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {user.name} {user.lastName}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {user.phone}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {targetUsers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {targetUsers.slice(0, 20).map((user) => (
                <Badge key={user.id} variant="secondary">
                  {user.name} {user.lastName}
                </Badge>
              ))}
              {targetUsers.length > 20 ? (
                <Badge variant="outline">+{targetUsers.length - 20}</Badge>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mealMode === "shared" ? "default" : "outline"}
          onClick={() => setMealMode("shared")}
        >
          یکسان برای همه
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mealMode === "per_user" ? "default" : "outline"}
          onClick={() => setMealMode("per_user")}
        >
          جداگانه برای هر نفر
        </Button>
      </div>

      {mealMode === "shared" ? (
        <MealDraftEditor
          title="وعده‌های روز"
          description="انتخاب یکسان برای همه کاربران · رزرو قبلی همان وعده جایگزین می‌شود"
          draft={sharedDraft}
          mealPeriods={mealPeriods}
          editable={editable}
          pending={pending}
          canSetQuantity={canSetQuantity}
          showQuantity={false}
          canSelectDeliveryLocation={canSelectDeliveryLocation}
          deliveryLocations={deliveryLocations}
          quantityInputId="proxy-quantity-shared"
          defaultLocationLabel="پیش‌فرض هر کاربر"
          showDefaultLocationOption
          onChange={patchSharedDraft}
        />
      ) : targetUsers.length === 0 ? (
        <p className="text-booking-secondary text-sm">
          ابتدا کاربران یا لیست را انتخاب کنید.
        </p>
      ) : (
        <div className="space-y-8">
          {targetUsers.map((user) => {
            const draft = draftForUser(user);
            return (
              <MealDraftEditor
                key={user.id}
                title={`${user.name} ${user.lastName}`}
                description={user.phone}
                draft={draft}
                mealPeriods={mealPeriods}
                editable={editable}
                pending={pending}
                canSetQuantity={canSetQuantity}
                canSelectDeliveryLocation={canSelectDeliveryLocation}
                deliveryLocations={deliveryLocations}
                quantityInputId={`proxy-quantity-${user.id}`}
                onChange={(patch) => patchUserDraft(user.id, patch)}
              />
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-700" role="status">
              {successMessage}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={pending || !canSubmit}
            onClick={submit}
          >
            {pending
              ? "در حال ثبت…"
              : `ثبت رزرو برای ${targetUserIds.length || "…"} نفر`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
