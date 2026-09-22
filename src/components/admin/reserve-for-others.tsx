"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FunnelX, ListFilterPlus } from "lucide-react";

import { reserveForOthersAction } from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { ReservationQuantityInput } from "@/components/menu/reservation-quantity-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOOD_KINDS, type FoodKindValue } from "@/lib/meals/food-kind";
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

function ChoiceList({
  title,
  noneLabel,
  items,
  selectedId,
  disabled,
  onSelect,
}: {
  title: string;
  noneLabel: string;
  items: ReserveForMenuFood[];
  selectedId: string;
  disabled: boolean;
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
            disabled={disabled}
            className="shrink-0"
            onClick={() => onSelect("")}
          >
            {selectedId === "" ? "انتخاب‌شده" : "انتخاب"}
          </Button>
        </li>
        {items.map((item) => {
          const selected = selectedId === item.menuItemId;
          return (
            <li
              key={item.menuItemId}
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
                disabled={disabled}
                className="shrink-0"
                onClick={() => onSelect(item.menuItemId)}
              >
                {selected ? "انتخاب‌شده" : "انتخاب"}
              </Button>
            </li>
          );
        })}
      </ul>
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canSetQuantity ? (
            <div className="flex items-center gap-2">
              <Label htmlFor={quantityInputId} className="text-xs">
                تعداد
              </Label>
              <ReservationQuantityInput
                id={quantityInputId}
                value={draft.quantity}
                disabled={!editable || pending}
                onChange={(quantity) => onChange({ quantity })}
              />
            </div>
          ) : null}
          {canSelectDeliveryLocation && deliveryLocations.length > 0 ? (
            <div className="space-y-1">
              <Label className="text-xs">محل تحویل</Label>
              <select
                value={draft.locationId}
                disabled={!editable || pending}
                onChange={(e) => onChange({ locationId: e.target.value })}
                className="border-input h-8 min-w-40 rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
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
            </div>
          ) : null}
        </div>
      </div>

      {mealPeriods.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          برای این تاریخ منویی ثبت نشده است.
        </p>
      ) : (
        <div className="space-y-6">
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

            return (
              <section
                key={period.id}
                className="border-border/70 space-y-3 rounded-xl border p-4"
              >
                <p className="text-sm font-semibold tracking-wide">
                  {period.title}
                </p>

                {mains.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    غذای اصلی ثبت نشده
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {mains.map((item) => {
                      const selected =
                        selection.mainMenuItemId === item.menuItemId;
                      return (
                        <li
                          key={item.menuItemId}
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
                            disabled={!editable || pending}
                            className="shrink-0"
                            onClick={() =>
                              updatePeriod(period.id, {
                                mainMenuItemId: item.menuItemId,
                              })
                            }
                          >
                            {selected ? "انتخاب‌شده" : "انتخاب"}
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
                  selectedId={selection.drinkMenuItemId}
                  disabled={!editable || pending}
                  onSelect={(menuItemId) =>
                    updatePeriod(period.id, { drinkMenuItemId: menuItemId })
                  }
                />
                <ChoiceList
                  title="ماست و سالاد"
                  noneLabel="بدون ماست و سالاد"
                  items={sides}
                  selectedId={selection.sideMenuItemId}
                  disabled={!editable || pending}
                  onSelect={(menuItemId) =>
                    updatePeriod(period.id, { sideMenuItemId: menuItemId })
                  }
                />
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
        <Card>
          <CardContent className="space-y-5 pt-6">
            <MealDraftEditor
              title="وعده‌های روز"
              description="انتخاب یکسان برای همه کاربران · رزرو قبلی همان وعده جایگزین می‌شود"
              draft={sharedDraft}
              mealPeriods={mealPeriods}
              editable={editable}
              pending={pending}
              canSetQuantity={canSetQuantity}
              canSelectDeliveryLocation={canSelectDeliveryLocation}
              deliveryLocations={deliveryLocations}
              quantityInputId="proxy-quantity-shared"
              defaultLocationLabel="پیش‌فرض هر کاربر"
              showDefaultLocationOption
              onChange={patchSharedDraft}
            />
          </CardContent>
        </Card>
      ) : targetUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              ابتدا کاربران یا لیست را انتخاب کنید.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {targetUsers.map((user) => {
            const draft = draftForUser(user);
            return (
              <Card key={user.id}>
                <CardContent className="space-y-5 pt-6">
                  <MealDraftEditor
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
                </CardContent>
              </Card>
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
