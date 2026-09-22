"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FunnelX, ListFilterPlus, Pencil } from "lucide-react";

import {
  setReservationStatusAction,
  updateAdminReservationAction,
} from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReservationQuantityInput } from "@/components/menu/reservation-quantity-input";
import { FOOD_KINDS, type FoodKindValue } from "@/lib/meals/food-kind";
import { cn } from "@/lib/utils";

export type ReservationReportRow = {
  id: string;
  dateKey: string;
  displayDate: string;
  userId: string;
  userName: string;
  userLastName: string;
  userPhone: string;
  mealPeriodId: string;
  mealPeriodTitle: string;
  foodId: string;
  foodTitle: string;
  drinkTitle: string | null;
  sideTitle: string | null;
  drinkMenuItemId: string | null;
  sideMenuItemId: string | null;
  drinkFoodId: string | null;
  sideFoodId: string | null;
  quantity: number;
  deliveryLocationId: string;
  deliveryLocationTitle: string;
};

export type DeliveryLocationOption = {
  id: string;
  title: string;
};

export type UserListFilterOption = {
  id: string;
  title: string;
  memberUserIds: string[];
};

export type DayMenuFoodOption = {
  menuItemId: string;
  foodId: string;
  title: string;
  description: string | null;
  kind: FoodKindValue;
};

export type DayMenuPeriodOption = {
  id: string;
  title: string;
  foods: DayMenuFoodOption[];
};

function AddonChoices({
  title,
  noneLabel,
  items,
  selectedId,
  pending,
  onSelect,
}: {
  title: string;
  noneLabel: string;
  items: DayMenuFoodOption[];
  selectedId: string;
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
            disabled={pending}
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
              <p className="text-sm font-medium">{item.title}</p>
              <Button
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                disabled={pending}
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

type ReservationsReportTableProps = {
  rows: ReservationReportRow[];
  deliveryLocations: DeliveryLocationOption[];
  menusByDate?: Record<string, DayMenuPeriodOption[]>;
  mealPeriods?: { id: string; title: string }[];
  userLists?: UserListFilterOption[];
  fromDateKey: string;
  toDateKey: string;
  canSetQuantity?: boolean;
};

function reportsHref(fromKey: string, toKey: string) {
  const params = new URLSearchParams({ date: fromKey });
  if (toKey && toKey !== fromKey) {
    params.set("to", toKey);
  }
  return `/admin/reports?${params.toString()}`;
}

export function ReservationsReportTable({
  rows = [],
  deliveryLocations = [],
  menusByDate = {},
  mealPeriods = [],
  userLists = [],
  fromDateKey,
  toDateKey,
  canSetQuantity = false,
}: ReservationsReportTableProps) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedFromDate, setSelectedFromDate] = useState(fromDateKey);
  const [selectedToDate, setSelectedToDate] = useState(toDateKey);
  const [mealPeriodId, setMealPeriodId] = useState("all");
  const [userListId, setUserListId] = useState("all");
  const [foodSearch, setFoodSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [editingRow, setEditingRow] = useState<ReservationReportRow | null>(
    null,
  );
  const [editLocationId, setEditLocationId] = useState("");
  const [editMealPeriodId, setEditMealPeriodId] = useState("");
  const [editMenuItemId, setEditMenuItemId] = useState("");
  const [editDrinkMenuItemId, setEditDrinkMenuItemId] = useState("");
  const [editSideMenuItemId, setEditSideMenuItemId] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editDayMenuPeriods = editingRow
    ? (menusByDate[editingRow.dateKey] ?? [])
    : [];
  const periodOptions = mealPeriods;

  const selectedListMemberIds = useMemo(() => {
    if (userListId === "all") return null;
    const list = userLists.find((item) => item.id === userListId);
    return new Set(list?.memberUserIds ?? []);
  }, [userListId, userLists]);

  useEffect(() => {
    setSelectedFromDate(fromDateKey);
    setSelectedToDate(toDateKey);
  }, [fromDateKey, toDateKey]);

  const filteredRows = useMemo(() => {
    const foodQ = foodSearch.trim().toLowerCase();
    const nameQ = nameSearch.trim().toLowerCase();
    const lastNameQ = lastNameSearch.trim().toLowerCase();
    const phoneQ = phoneSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (mealPeriodId !== "all" && row.mealPeriodId !== mealPeriodId) {
        return false;
      }
      if (selectedListMemberIds && !selectedListMemberIds.has(row.userId)) {
        return false;
      }
      const foodHaystack = [row.foodTitle, row.drinkTitle, row.sideTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (foodQ && !foodHaystack.includes(foodQ)) return false;
      if (nameQ && !row.userName.toLowerCase().includes(nameQ)) return false;
      if (lastNameQ && !row.userLastName.toLowerCase().includes(lastNameQ)) {
        return false;
      }
      if (phoneQ && !row.userPhone.toLowerCase().includes(phoneQ)) return false;
      return true;
    });
  }, [
    rows,
    mealPeriodId,
    selectedListMemberIds,
    foodSearch,
    nameSearch,
    lastNameSearch,
    phoneSearch,
  ]);

  const editFoods = useMemo(() => {
    return (
      editDayMenuPeriods.find((period) => period.id === editMealPeriodId)
        ?.foods ?? []
    );
  }, [editDayMenuPeriods, editMealPeriodId]);
  const editMainFoods = editFoods.filter(
    (food) => food.kind === FOOD_KINDS.MAIN,
  );
  const editDrinks = editFoods.filter((food) => food.kind === FOOD_KINDS.DRINK);
  const editSides = editFoods.filter(
    (food) => food.kind === FOOD_KINDS.YOGURT_SALAD,
  );

  function resetFilters() {
    setMealPeriodId("all");
    setUserListId("all");
    setFoodSearch("");
    setNameSearch("");
    setLastNameSearch("");
    setPhoneSearch("");
  }

  function navigateDateRange(nextFrom: string, nextTo: string) {
    if (!nextFrom) return;
    let from = nextFrom;
    let to = nextTo || nextFrom;
    if (to < from) {
      to = from;
    }
    if (from === fromDateKey && to === toDateKey) return;
    router.push(reportsHref(from, to));
  }

  function handleFromDateChange(date: string | string[]) {
    const next = typeof date === "string" ? date : (date[0] ?? "");
    setSelectedFromDate(next);
    if (!next) return;
    const nextTo =
      selectedToDate && selectedToDate < next ? next : selectedToDate || next;
    setSelectedToDate(nextTo);
    navigateDateRange(next, nextTo);
  }

  function handleToDateChange(date: string | string[]) {
    const next = typeof date === "string" ? date : (date[0] ?? "");
    setSelectedToDate(next);
    if (!next || !selectedFromDate) return;
    const nextFrom = selectedFromDate > next ? next : selectedFromDate;
    setSelectedFromDate(nextFrom);
    navigateDateRange(nextFrom, next);
  }

  function pickMenuItemId(
    foods: DayMenuFoodOption[],
    menuItemId: string | null | undefined,
    foodId: string | null | undefined,
  ) {
    return (
      foods.find((food) => food.menuItemId === menuItemId)?.menuItemId ??
      foods.find((food) => food.foodId === foodId)?.menuItemId ??
      ""
    );
  }

  function applyPeriodSelection(row: ReservationReportRow) {
    const dayMenus = menusByDate[row.dateKey] ?? [];
    const period = dayMenus.find((item) => item.id === row.mealPeriodId);
    const foods = period?.foods ?? [];
    const mains = foods.filter((food) => food.kind === FOOD_KINDS.MAIN);
    const drinks = foods.filter((food) => food.kind === FOOD_KINDS.DRINK);
    const sides = foods.filter((food) => food.kind === FOOD_KINDS.YOGURT_SALAD);
    setEditMealPeriodId(row.mealPeriodId);
    setEditMenuItemId(
      pickMenuItemId(mains, undefined, row.foodId) ||
        mains[0]?.menuItemId ||
        "",
    );
    setEditDrinkMenuItemId(
      pickMenuItemId(drinks, row.drinkMenuItemId, row.drinkFoodId),
    );
    setEditSideMenuItemId(
      pickMenuItemId(sides, row.sideMenuItemId, row.sideFoodId),
    );
  }

  function openEditDialog(row: ReservationReportRow) {
    setEditingRow(row);
    setEditLocationId(row.deliveryLocationId);
    setEditQuantity(row.quantity ?? 1);
    applyPeriodSelection(row);
    setError(null);
  }

  function handleSave() {
    if (!editingRow || !editMenuItemId || !editLocationId) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateAdminReservationAction(
          editingRow.id,
          editMenuItemId,
          editLocationId,
          editDrinkMenuItemId || null,
          editSideMenuItemId || null,
          canSetQuantity ? editQuantity : null,
        );
        setEditingRow(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ذخیره ناموفق بود");
      }
    });
  }

  function handleDelete() {
    if (!editingRow) return;
    if (!window.confirm("آیا از حذف این رزرو مطمئن هستید؟")) return;
    setError(null);
    startTransition(async () => {
      try {
        await setReservationStatusAction(editingRow.id, "CANCELLED");
        setEditingRow(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حذف ناموفق بود");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "bg-card transition-all duration-300 overflow-visible",
          "**:data-[slot=input]:bg-background [&_input]:bg-background [&_select]:bg-background",
          filtersOpen
            ? "border-b border-[#aeaeae] py-3 lg:py-4"
            : "py-1 lg:py-2",
        )}
      >
        <CardContent className="flex flex-col gap-3 px-2 lg:px-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ListFilterPlus className="size-5" />
              <span className="text-sm font-medium">فیلترها</span>
              <Button
                size="icon-sm"
                variant="ghost"
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    filtersOpen && "rotate-180",
                  )}
                />
              </Button>
            </div>
            <Button
              size="icon"
              variant="outline"
              type="button"
              onClick={resetFilters}
              title="پاک کردن فیلترها"
            >
              <FunnelX className="size-4 text-red-600" />
            </Button>
          </div>

          {filtersOpen && (
            <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="report-from-date">از تاریخ</Label>
                <PersianDatePicker
                  id="report-from-date"
                  value={selectedFromDate}
                  onChange={handleFromDateChange}
                  maxDate={selectedToDate || undefined}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-to-date">تا تاریخ</Label>
                <PersianDatePicker
                  id="report-to-date"
                  value={selectedToDate}
                  onChange={handleToDateChange}
                  minDate={selectedFromDate || undefined}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-meal-period">وعده</Label>
                <select
                  id="report-meal-period"
                  value={mealPeriodId}
                  onChange={(e) => setMealPeriodId(e.target.value)}
                  className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">همه وعده‌ها</option>
                  {periodOptions.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.title}
                    </option>
                  ))}
                </select>
              </div>
              {userLists.length > 0 ? (
                <div className="space-y-1">
                  <Label htmlFor="report-user-list">لیست کاربر</Label>
                  <select
                    id="report-user-list"
                    value={userListId}
                    onChange={(e) => setUserListId(e.target.value)}
                    className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="all">همه لیست‌ها</option>
                    {userLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="space-y-1">
                <Label htmlFor="report-food">غذا</Label>
                <Input
                  id="report-food"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="جستجوی نام غذا"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-name">نام</Label>
                <Input
                  id="report-name"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="جستجوی نام"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-last-name">نام خانوادگی</Label>
                <Input
                  id="report-last-name"
                  value={lastNameSearch}
                  onChange={(e) => setLastNameSearch(e.target.value)}
                  placeholder="جستجوی نام خانوادگی"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="report-phone">موبایل</Label>
                <Input
                  id="report-phone"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="جستجوی موبایل"
                  dir="ltr"
                />
              </div>
              <p className="text-muted-foreground self-end text-sm sm:col-span-2">
                {filteredRows.length} از {rows.length} رزرو
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تاریخ</TableHead>
              <TableHead>نام</TableHead>
              <TableHead>نام خانوادگی</TableHead>
              <TableHead>موبایل</TableHead>
              <TableHead>وعده</TableHead>
              <TableHead>غذا</TableHead>
              <TableHead>تعداد</TableHead>
              <TableHead>نوشیدنی</TableHead>
              <TableHead>ماست و سالاد</TableHead>
              <TableHead>محل تحویل</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-muted-foreground text-center"
                >
                  {rows.length === 0
                    ? "داده‌ای نیست."
                    : "نتیجه‌ای با این فیلترها پیدا نشد."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.displayDate}</TableCell>
                  <TableCell>{row.userName}</TableCell>
                  <TableCell>{row.userLastName}</TableCell>
                  <TableCell dir="ltr">{row.userPhone}</TableCell>
                  <TableCell>{row.mealPeriodTitle}</TableCell>
                  <TableCell>{row.foodTitle}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.drinkTitle ?? "—"}</TableCell>
                  <TableCell>{row.sideTitle ?? "—"}</TableCell>
                  <TableCell>{row.deliveryLocationTitle}</TableCell>
                  <TableCell className="text-end">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      title="تدوین"
                      onClick={() => openEditDialog(row)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">تدوین</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={editingRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRow(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تدوین رزرو</DialogTitle>
            <DialogDescription>
              {editingRow
                ? `${editingRow.userName} ${editingRow.userLastName} · ${editingRow.userPhone}`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-delivery-location">محل تحویل</Label>
              <select
                id="edit-delivery-location"
                value={editLocationId}
                disabled={pending || deliveryLocations.length === 0}
                onChange={(e) => setEditLocationId(e.target.value)}
                className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                {deliveryLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.title}
                  </option>
                ))}
              </select>
            </div>

            <section className="flex flex-col gap-3 overflow-hidden rounded-xl border border-emerald-700/30 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_70%)] p-4 shadow-[0_1px_0_rgba(6,95,70,0.1)] ring-1 ring-emerald-600/10">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tracking-wide text-emerald-950">
                  {editDayMenuPeriods.find(
                    (period) => period.id === editMealPeriodId,
                  )?.title ??
                    editingRow?.mealPeriodTitle ??
                    "وعده"}
                </p>
                {canSetQuantity ? (
                  <ReservationQuantityInput
                    id="edit-reservation-quantity"
                    value={editQuantity}
                    disabled={pending}
                    onChange={setEditQuantity}
                  />
                ) : null}
              </div>

              {editMainFoods.length === 0 ? (
                <p className="text-muted-foreground text-xs">غذایی ثبت نشده</p>
              ) : (
                <ul className="space-y-2">
                  {editMainFoods.map((item) => {
                    const selected = editMenuItemId === item.menuItemId;
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
                          disabled={pending}
                          className="shrink-0"
                          onClick={() => setEditMenuItemId(item.menuItemId)}
                        >
                          {selected ? "انتخاب‌شده" : "انتخاب"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <AddonChoices
                title="نوشیدنی"
                noneLabel="بدون نوشیدنی"
                items={editDrinks}
                selectedId={editDrinkMenuItemId}
                pending={pending}
                onSelect={setEditDrinkMenuItemId}
              />
              <AddonChoices
                title="ماست و سالاد"
                noneLabel="بدون ماست و سالاد"
                items={editSides}
                selectedId={editSideMenuItemId}
                pending={pending}
                onSelect={setEditSideMenuItemId}
              />
            </section>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "…" : "حذف"}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setEditingRow(null)}
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={
                  pending ||
                  !editMenuItemId ||
                  !editLocationId ||
                  editDayMenuPeriods.length === 0
                }
                onClick={handleSave}
              >
                {pending ? "…" : "ذخیره"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
