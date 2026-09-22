"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, FunnelX, ListFilterPlus } from "lucide-react";

import { setReservationStatusAction } from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

export type HistoryRow = {
  id: string;
  dateKey: string;
  displayDate: string;
  mealPeriodId: string;
  mealPeriodTitle: string;
  foodTitle: string;
  quantity: number;
  drinkTitle: string | null;
  sideTitle: string | null;
  deliveryLocationTitle: string;
  deliveryLocationAddress: string;
  status: "ACTIVE" | "CANCELLED";
  userName: string;
  userLastName: string;
  userPhone: string;
};

export type MealPeriodOption = {
  id: string;
  title: string;
};

type StatusFilter = "all" | "ACTIVE" | "CANCELLED";

type ReservationHistoryProps = {
  rows: HistoryRow[];
  mealPeriods: MealPeriodOption[];
  canChangeStatus?: boolean;
  canSearchUsers?: boolean;
};

function statusLabel(status: HistoryRow["status"]) {
  return status === "ACTIVE" ? "فعال" : "لغوشده";
}

function userFullName(row: HistoryRow) {
  return `${row.userName} ${row.userLastName}`.trim();
}

export function ReservationHistory({
  rows,
  mealPeriods,
  canChangeStatus = false,
  canSearchUsers = false,
}: ReservationHistoryProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [mealPeriodId, setMealPeriodId] = useState("all");
  const [foodSearch, setFoodSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const foodQ = foodSearch.trim().toLowerCase();
    const nameQ = nameSearch.trim().toLowerCase();
    const lastNameQ = lastNameSearch.trim().toLowerCase();
    const phoneQ = phoneSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (fromDate && row.dateKey < fromDate) return false;
      if (toDate && row.dateKey > toDate) return false;
      if (status !== "all" && row.status !== status) return false;
      if (mealPeriodId !== "all" && row.mealPeriodId !== mealPeriodId) {
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
    fromDate,
    toDate,
    status,
    mealPeriodId,
    foodSearch,
    nameSearch,
    lastNameSearch,
    phoneSearch,
  ]);

  function resetFilters() {
    setFromDate("");
    setToDate("");
    setStatus("all");
    setMealPeriodId("all");
    setFoodSearch("");
    setNameSearch("");
    setLastNameSearch("");
    setPhoneSearch("");
  }

  function handleStatusChange(
    reservationId: string,
    nextStatus: HistoryRow["status"],
  ) {
    setPendingId(reservationId);
    startTransition(async () => {
      try {
        await setReservationStatusAction(reservationId, nextStatus);
      } finally {
        setPendingId(null);
      }
    });
  }

  const colSpan = canChangeStatus ? 8 : 7;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">سابقه رزروها</h1>
        <p className="text-muted-foreground text-sm">
          فهرست غذاهایی که تاکنون رزرو یا لغو کرده‌اید.
        </p>
      </div>

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
                <Label htmlFor="history-from">از تاریخ</Label>
                <PersianDatePicker
                  id="history-from"
                  value={fromDate}
                  onChange={(date) =>
                    setFromDate(
                      typeof date === "string" ? date : (date[0] ?? ""),
                    )
                  }
                  maxDate={toDate || undefined}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="history-to">تا تاریخ</Label>
                <PersianDatePicker
                  id="history-to"
                  value={toDate}
                  onChange={(date) =>
                    setToDate(typeof date === "string" ? date : (date[0] ?? ""))
                  }
                  minDate={fromDate || undefined}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="history-status">وضعیت</Label>
                <select
                  id="history-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">همه</option>
                  <option value="ACTIVE">فعال</option>
                  <option value="CANCELLED">لغوشده</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="history-meal-period">وعده</Label>
                <select
                  id="history-meal-period"
                  value={mealPeriodId}
                  onChange={(e) => setMealPeriodId(e.target.value)}
                  className="border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">همه وعده‌ها</option>
                  {mealPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="history-food">غذا</Label>
                <Input
                  id="history-food"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="جستجوی نام غذا"
                />
              </div>
              {canSearchUsers && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="history-name">نام</Label>
                    <Input
                      id="history-name"
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      placeholder="جستجوی نام"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="history-last-name">نام خانوادگی</Label>
                    <Input
                      id="history-last-name"
                      value={lastNameSearch}
                      onChange={(e) => setLastNameSearch(e.target.value)}
                      placeholder="جستجوی نام خانوادگی"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="history-phone">موبایل</Label>
                    <Input
                      id="history-phone"
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                      placeholder="جستجوی موبایل"
                      dir="ltr"
                    />
                  </div>
                </>
              )}
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
              <TableHead className="text-center">تاریخ</TableHead>
              <TableHead className="text-center">کاربر</TableHead>
              <TableHead className="text-center">وعده</TableHead>
              <TableHead className="text-center">غذا</TableHead>
              <TableHead className="text-center">تعداد</TableHead>
              <TableHead className="text-center">محل تحویل</TableHead>
              <TableHead className="text-center">وضعیت</TableHead>
              {canChangeStatus && (
                <TableHead className="text-center">عملیات</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-muted-foreground text-center"
                >
                  {rows.length === 0
                    ? "هنوز رزروی ثبت نشده است."
                    : "نتیجه‌ای با این فیلترها پیدا نشد."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const rowPending = pending && pendingId === row.id;
                const nextStatus =
                  row.status === "ACTIVE" ? "CANCELLED" : "ACTIVE";
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-center">
                      {row.displayDate}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{userFullName(row)}</span>
                        <span
                          className="text-muted-foreground text-xs"
                          dir="ltr"
                        >
                          {row.userPhone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.mealPeriodTitle}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{row.foodTitle}</span>
                        {row.drinkTitle ? (
                          <span className="text-muted-foreground text-xs">
                            نوشیدنی: {row.drinkTitle}
                          </span>
                        ) : null}
                        {row.sideTitle ? (
                          <span className="text-muted-foreground text-xs">
                            ماست و سالاد: {row.sideTitle}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{row.deliveryLocationTitle}</span>
                        {row.deliveryLocationAddress ? (
                          <span className="text-muted-foreground text-xs">
                            {row.deliveryLocationAddress}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          row.status === "ACTIVE" ? "success" : "outline"
                        }
                      >
                        {statusLabel(row.status)}
                      </Badge>
                    </TableCell>
                    {canChangeStatus && (
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={rowPending}
                          onClick={() => handleStatusChange(row.id, nextStatus)}
                        >
                          {rowPending
                            ? "…"
                            : row.status === "ACTIVE"
                              ? "لغو"
                              : "فعال‌سازی"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
