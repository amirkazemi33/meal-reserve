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

import { deleteFoodAction, upsertFoodAction } from "@/app/actions";
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
import {
  FOOD_KIND_OPTIONS,
  foodKindLabel,
  type FoodKindValue,
} from "@/lib/meals/food-kind";
import { cn } from "@/lib/utils";

export type FoodListItem = {
  id: string;
  title: string;
  description: string | null;
  kind: FoodKindValue;
  isActive: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const SELECT_CLASS =
  "border-input h-8 w-full rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type StatusFilter = "all" | "active" | "inactive";
type KindFilter = "all" | FoodKindValue;

type FoodsManagementProps = {
  foods: FoodListItem[];
};

export function FoodsManagement({ foods }: FoodsManagementProps) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FoodListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const filteredFoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    return foods.filter((food) => {
      if (q) {
        const haystack =
          `${food.title} ${food.description ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (kind !== "all" && food.kind !== kind) return false;
      if (status === "active" && !food.isActive) return false;
      if (status === "inactive" && food.isActive) return false;
      return true;
    });
  }, [foods, search, kind, status]);

  useEffect(() => {
    setPage(1);
  }, [search, kind, status]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedFoods = filteredFoods.slice(pageStart, pageStart + pageSize);

  function resetFilters() {
    setSearch("");
    setKind("all");
    setStatus("all");
  }

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await upsertFoodAction(formData);
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
        await upsertFoodAction(formData);
        setEditing(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ذخیره ناموفق بود");
      }
    });
  }

  function handleDelete() {
    if (!editing) return;
    if (!confirm(`غذا «${editing.title}» حذف شود؟`)) return;
    const foodId = editing.id;
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteFoodAction(foodId);
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
          <h1 className="text-2xl font-semibold tracking-tight">غذاها</h1>
          <p className="text-muted-foreground text-sm">
            فهرست غذا، نوشیدنی، و ماست و سالاد که می‌توانند در منو قرار گیرند.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <CirclePlus
            className="size-4 text-green-700"
            data-icon="inline-start"
          />
          غذای جدید
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
                title="غذای جدید"
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
                <Label htmlFor="food-search">جستجو</Label>
                <Input
                  id="food-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="عنوان یا توضیحات"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="food-kind-filter">نوع</Label>
                <select
                  id="food-kind-filter"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as KindFilter)}
                  className={SELECT_CLASS}
                >
                  <option value="all">همه انواع</option>
                  {FOOD_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="food-status-filter">وضعیت</Label>
                <select
                  id="food-status-filter"
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
                {filteredFoods.length} از {foods.length} غذا
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
                <TableHead className="text-right">نوع</TableHead>
                <TableHead className="text-right">توضیحات</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedFoods.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground text-center"
                  >
                    غذایی با این فیلترها پیدا نشد.
                  </TableCell>
                </TableRow>
              ) : (
                pagedFoods.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell>{food.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {foodKindLabel(food.kind)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal">
                      {food.description ? (
                        food.description
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={food.isActive ? "success" : "outline"}>
                        {food.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setError(null);
                          setEditing(food);
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

        {filteredFoods.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Label htmlFor="foods-page-size">تعداد در صفحه</Label>
              <select
                id="foods-page-size"
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
            <DialogTitle>غذای جدید</DialogTitle>
            <DialogDescription>
              عنوان، نوع و توضیحات غذا را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-food-title">عنوان</Label>
              <Input id="create-food-title" name="title" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-food-kind">نوع</Label>
              <select
                id="create-food-kind"
                name="kind"
                defaultValue="MAIN"
                className={SELECT_CLASS}
              >
                {FOOD_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-food-description">توضیحات</Label>
              <Textarea
                id="create-food-description"
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
            <DialogTitle>تدوین غذا</DialogTitle>
            <DialogDescription>
              {editing ? editing.title : "اطلاعات غذا را ویرایش کنید."}
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <form key={editing.id} action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={editing.id} />
              <div className="space-y-1">
                <Label htmlFor="edit-food-title">عنوان</Label>
                <Input
                  id="edit-food-title"
                  name="title"
                  defaultValue={editing.title}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-food-kind">نوع</Label>
                <select
                  id="edit-food-kind"
                  name="kind"
                  defaultValue={editing.kind}
                  className={SELECT_CLASS}
                >
                  {FOOD_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-food-description">توضیحات</Label>
                <Textarea
                  id="edit-food-description"
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
