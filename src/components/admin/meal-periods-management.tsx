"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  FunnelX,
  ListFilterPlus,
  Pencil,
} from "lucide-react";

import {
  deleteMealPeriodAction,
  upsertMealPeriodAction,
} from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type MealPeriodListItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const SELECT_CLASS =
  "border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type StatusFilter = "all" | "active" | "inactive";

type MealPeriodsManagementProps = {
  periods: MealPeriodListItem[];
};

export function MealPeriodsManagement({ periods }: MealPeriodsManagementProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MealPeriodListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const filteredPeriods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periods.filter((period) => {
      if (q) {
        const haystack =
          `${period.title} ${period.description ?? ""} ${period.startTime} ${period.endTime}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (status === "active" && !period.isActive) return false;
      if (status === "inactive" && period.isActive) return false;
      return true;
    });
  }, [periods, search, status]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredPeriods.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedPeriods = filteredPeriods.slice(pageStart, pageStart + pageSize);

  function resetFilters() {
    setSearch("");
    setStatus("all");
  }

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await upsertMealPeriodAction(formData);
        setCreateOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ثبت ناموفق بود");
      }
    });
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await upsertMealPeriodAction(formData);
        setEditing(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ذخیره ناموفق بود");
      }
    });
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm(`وعده «${editing.title}» حذف شود؟`)) return;
    const periodId = editing.id;
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteMealPeriodAction(periodId);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setEditing(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حذف ناموفق بود");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            وعده‌های غذایی
          </h1>
          <p className="text-muted-foreground text-sm">
            تعریف وعده با عنوان، بازه ساعتی و توضیحات.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <CirclePlus
            className="size-4 text-green-700"
            data-icon="inline-start"
          />
          وعده جدید
        </Button>
      </div>

      <Card
        className={cn(
          "bg-card transition-all duration-300",
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
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                type="button"
                onClick={() => setCreateOpen(true)}
                title="وعده جدید"
              >
                <CirclePlus className="size-4 text-green-700" />
              </Button>
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
          </div>

          {filtersOpen && (
            <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="period-search">جستجو</Label>
                <Input
                  id="period-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="عنوان، توضیحات یا ساعت"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="period-status-filter">وضعیت</Label>
                <select
                  id="period-status-filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className={SELECT_CLASS}
                >
                  <option value="all">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
              <p className="text-muted-foreground self-end text-sm">
                {filteredPeriods.length} از {periods.length} وعده
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">عنوان</TableHead>
                <TableHead className="text-right">شروع</TableHead>
                <TableHead className="text-right">پایان</TableHead>
                <TableHead className="text-right">ترتیب</TableHead>
                <TableHead className="text-right">توضیحات</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedPeriods.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground text-center"
                  >
                    وعده‌ای با این فیلترها پیدا نشد.
                  </TableCell>
                </TableRow>
              ) : (
                pagedPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>{period.title}</TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {period.startTime}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {period.endTime}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {period.sortOrder}
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal">
                      {period.description ? (
                        period.description
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={period.isActive ? "success" : "outline"}>
                        {period.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setError(null);
                          setEditing(period);
                        }}
                      >
                        <Pencil data-icon="inline-start" />
                        تدوین
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredPeriods.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="periods-page-size">تعداد در صفحه</Label>
              <select
                id="periods-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(
                    Number(
                      e.target.value,
                    ) as (typeof PAGE_SIZE_OPTIONS)[number],
                  );
                  setPage(1);
                }}
                className="border-input h-8 rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="صفحه قبل"
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-muted-foreground min-w-20 text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="صفحه بعد"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>وعده جدید</DialogTitle>
            <DialogDescription>
              عنوان، بازه ساعتی و توضیحات وعده را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-period-title">عنوان</Label>
              <Input
                id="create-period-title"
                name="title"
                required
                placeholder="ناهار"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="create-period-start">شروع</Label>
                <PersianDatePicker
                  id="create-period-start"
                  name="startTime"
                  onlyTimePicker
                  required
                  placeholder="۱۲:۰۰"
                  datePickerProps={{ portal: true, zIndex: 80 }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="create-period-end">پایان</Label>
                <PersianDatePicker
                  id="create-period-end"
                  name="endTime"
                  onlyTimePicker
                  required
                  placeholder="۱۴:۰۰"
                  datePickerProps={{ portal: true, zIndex: 80 }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-period-sort">ترتیب نمایش</Label>
              <Input
                id="create-period-sort"
                name="sortOrder"
                type="number"
                defaultValue={0}
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-period-description">توضیحات</Label>
              <Textarea
                id="create-period-description"
                name="description"
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked />
              فعال
            </label>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setCreateOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "…" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تدوین وعده</DialogTitle>
            <DialogDescription>
              {editing
                ? editing.title
                : "اطلاعات وعده را ویرایش، غیرفعال، یا حذف کنید."}
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <form
              key={editing.id}
              action={handleUpdate}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editing.id} />
              <div className="space-y-1">
                <Label htmlFor="edit-period-title">عنوان</Label>
                <Input
                  id="edit-period-title"
                  name="title"
                  defaultValue={editing.title}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-period-start">شروع</Label>
                  <PersianDatePicker
                    id="edit-period-start"
                    name="startTime"
                    defaultValue={editing.startTime}
                    onlyTimePicker
                    required
                    placeholder="۱۲:۰۰"
                    datePickerProps={{ portal: true, zIndex: 80 }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-period-end">پایان</Label>
                  <PersianDatePicker
                    id="edit-period-end"
                    name="endTime"
                    defaultValue={editing.endTime}
                    onlyTimePicker
                    required
                    placeholder="۱۴:۰۰"
                    datePickerProps={{ portal: true, zIndex: 80 }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-period-sort">ترتیب نمایش</Label>
                <Input
                  id="edit-period-sort"
                  name="sortOrder"
                  type="number"
                  defaultValue={editing.sortOrder}
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-period-description">توضیحات</Label>
                <Textarea
                  id="edit-period-description"
                  name="description"
                  rows={2}
                  defaultValue={editing.description ?? ""}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editing.isActive}
                />
                فعال
              </label>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:me-auto"
                  disabled={pending}
                  onClick={handleDelete}
                >
                  {pending ? "…" : "حذف"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(null)}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "…" : "تأیید"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
