"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, FunnelX, ListFilterPlus } from "lucide-react";

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
import type { FeedbackReportRow } from "@/lib/meals/feedback";
import { cn } from "@/lib/utils";

const COMMENT_PREVIEW_LENGTH = 72;

type MealPeriodOption = {
  id: string;
  title: string;
};

type FeedbackReportTableProps = {
  rows: FeedbackReportRow[];
  mealPeriods: MealPeriodOption[];
  fromDateKey: string;
  toDateKey: string;
};

function feedbackHref(fromKey: string, toKey: string) {
  const params = new URLSearchParams({ date: fromKey });
  if (toKey && toKey !== fromKey) {
    params.set("to", toKey);
  }
  return `/admin/feedback?${params.toString()}`;
}

function previewComment(comment: string | null) {
  const text = comment?.trim() ?? "";
  if (!text) return "—";
  if (text.length <= COMMENT_PREVIEW_LENGTH) return text;
  return `${text.slice(0, COMMENT_PREVIEW_LENGTH).trimEnd()}…`;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`امتیاز ${rating.toLocaleString("fa-IR")} از ۵`}
    >
      <span aria-hidden className="tracking-tight text-amber-500" dir="ltr">
        {"★".repeat(rating)}
        <span className="text-muted-foreground/35">
          {"★".repeat(Math.max(0, 5 - rating))}
        </span>
      </span>
      <span className="text-muted-foreground text-xs">
        {rating.toLocaleString("fa-IR")}
      </span>
    </span>
  );
}

export function FeedbackReportTable({
  rows,
  mealPeriods,
  fromDateKey,
  toDateKey,
}: FeedbackReportTableProps) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedFromDate, setSelectedFromDate] = useState(fromDateKey);
  const [selectedToDate, setSelectedToDate] = useState(toDateKey);
  const [seenFromDate, setSeenFromDate] = useState(fromDateKey);
  const [seenToDate, setSeenToDate] = useState(toDateKey);
  const [mealPeriodId, setMealPeriodId] = useState("all");
  const [nameSearch, setNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [foodSearch, setFoodSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [commentFilter, setCommentFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<FeedbackReportRow | null>(
    null,
  );

  if (fromDateKey !== seenFromDate) {
    setSeenFromDate(fromDateKey);
    setSelectedFromDate(fromDateKey);
  }

  if (toDateKey !== seenToDate) {
    setSeenToDate(toDateKey);
    setSelectedToDate(toDateKey);
  }

  const filteredRows = useMemo(() => {
    const nameQ = nameSearch.trim().toLowerCase();
    const lastNameQ = lastNameSearch.trim().toLowerCase();
    const phoneQ = phoneSearch.trim().toLowerCase();
    const foodQ = foodSearch.trim().toLowerCase();
    const rating = ratingFilter === "all" ? null : Number(ratingFilter);

    return rows.filter((row) => {
      if (mealPeriodId !== "all" && row.mealPeriodId !== mealPeriodId) {
        return false;
      }
      if (nameQ && !row.userName.toLowerCase().includes(nameQ)) return false;
      if (lastNameQ && !row.userLastName.toLowerCase().includes(lastNameQ)) {
        return false;
      }
      if (phoneQ && !row.userPhone.toLowerCase().includes(phoneQ)) return false;
      if (foodQ && !row.foodTitle.toLowerCase().includes(foodQ)) return false;
      if (rating !== null && row.rating !== rating) return false;
      const hasComment = Boolean(row.comment?.trim());
      if (commentFilter === "with" && !hasComment) return false;
      if (commentFilter === "without" && hasComment) return false;
      return true;
    });
  }, [
    rows,
    mealPeriodId,
    nameSearch,
    lastNameSearch,
    phoneSearch,
    foodSearch,
    ratingFilter,
    commentFilter,
  ]);

  function resetFilters() {
    setMealPeriodId("all");
    setNameSearch("");
    setLastNameSearch("");
    setPhoneSearch("");
    setFoodSearch("");
    setRatingFilter("all");
    setCommentFilter("all");
  }

  function navigateDateRange(nextFrom: string, nextTo: string) {
    if (!nextFrom) return;
    const from = nextFrom;
    let to = nextTo || nextFrom;
    if (to < from) to = from;
    if (from === fromDateKey && to === toDateKey) return;
    router.push(feedbackHref(from, to));
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

  const selectClassName =
    "border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "bg-card overflow-visible transition-all duration-300",
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

          {filtersOpen ? (
            <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="feedback-from-date">از تاریخ</Label>
                <PersianDatePicker
                  id="feedback-from-date"
                  value={selectedFromDate}
                  onChange={handleFromDateChange}
                  maxDate={selectedToDate || undefined}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-to-date">تا تاریخ</Label>
                <PersianDatePicker
                  id="feedback-to-date"
                  value={selectedToDate}
                  onChange={handleToDateChange}
                  minDate={selectedFromDate || undefined}
                  placeholder="انتخاب تاریخ"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-meal-period">وعده</Label>
                <select
                  id="feedback-meal-period"
                  value={mealPeriodId}
                  onChange={(event) => setMealPeriodId(event.target.value)}
                  className={selectClassName}
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
                <Label htmlFor="feedback-rating">امتیاز</Label>
                <select
                  id="feedback-rating"
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                  className={selectClassName}
                >
                  <option value="all">همه امتیازها</option>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={String(value)}>
                      {value.toLocaleString("fa-IR")} از ۵
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-comment">متن نظر</Label>
                <select
                  id="feedback-comment"
                  value={commentFilter}
                  onChange={(event) => setCommentFilter(event.target.value)}
                  className={selectClassName}
                >
                  <option value="all">همه</option>
                  <option value="with">دارای متن</option>
                  <option value="without">فقط امتیاز</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-food">غذا</Label>
                <Input
                  id="feedback-food"
                  value={foodSearch}
                  onChange={(event) => setFoodSearch(event.target.value)}
                  placeholder="جستجوی نام غذا"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-name">نام</Label>
                <Input
                  id="feedback-name"
                  value={nameSearch}
                  onChange={(event) => setNameSearch(event.target.value)}
                  placeholder="جستجوی نام"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-last-name">نام خانوادگی</Label>
                <Input
                  id="feedback-last-name"
                  value={lastNameSearch}
                  onChange={(event) => setLastNameSearch(event.target.value)}
                  placeholder="جستجوی نام خانوادگی"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feedback-phone">موبایل</Label>
                <Input
                  id="feedback-phone"
                  value={phoneSearch}
                  onChange={(event) => setPhoneSearch(event.target.value)}
                  placeholder="جستجوی موبایل"
                  dir="ltr"
                />
              </div>
              <p className="text-muted-foreground self-end text-sm sm:col-span-2">
                {filteredRows.length.toLocaleString("fa-IR")} از{" "}
                {rows.length.toLocaleString("fa-IR")} نظر
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تاریخ</TableHead>
              <TableHead>اسم و فامیل</TableHead>
              <TableHead>وعده</TableHead>
              <TableHead>نظر</TableHead>
              <TableHead>امتیاز</TableHead>
              <TableHead className="w-24">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  نظری در این بازه یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {row.displayDate}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.userName} {row.userLastName}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.mealPeriodTitle}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.foodTitle}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 wrap-break-word">
                      {previewComment(row.comment)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <RatingStars rating={row.rating} />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRow(row)}
                    >
                      <Eye data-icon="inline-start" />
                      مشاهده
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={selectedRow !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>متن کامل نظر</DialogTitle>
            <DialogDescription>
              {selectedRow
                ? `${selectedRow.userName} ${selectedRow.userLastName}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {selectedRow ? (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2">
                <dt className="text-muted-foreground">تاریخ وعده</dt>
                <dd>{selectedRow.displayDate}</dd>
                <dt className="text-muted-foreground">وعده</dt>
                <dd>{selectedRow.mealPeriodTitle}</dd>
                <dt className="text-muted-foreground">غذا</dt>
                <dd>{selectedRow.foodTitle}</dd>
                <dt className="text-muted-foreground">موبایل</dt>
                <dd dir="ltr" className="text-left">
                  {selectedRow.userPhone}
                </dd>
                <dt className="text-muted-foreground">امتیاز</dt>
                <dd>
                  <RatingStars rating={selectedRow.rating} />
                </dd>
                <dt className="text-muted-foreground">زمان ثبت</dt>
                <dd>{selectedRow.submittedAtLabel}</dd>
              </dl>
              <div className="space-y-1">
                <p className="text-muted-foreground">نظر</p>
                <p className="bg-muted/50 rounded-lg px-3 py-2 leading-6 whitespace-pre-wrap">
                  {selectedRow.comment?.trim() || "نظری ثبت نشده است."}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedRow(null)}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
