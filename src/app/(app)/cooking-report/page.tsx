import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getCookingReport,
  getMealPeriods,
  parseDateKey,
} from "@/lib/meals";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addDays, startOfDay } from "@/lib/meals/dates";
import PersianDatePicker from "@/components/common/persian-date-picker";

type SearchParams = Promise<{ date?: string; mealPeriodId?: string }>;

const QUICK_DATES = [
  { label: "امروز", offset: 0 },
  { label: "فردا", offset: 1 },
  { label: "پس فردا", offset: 2 },
] as const;

function cookingReportHref(dateKey: string, mealPeriodId?: string) {
  const params = new URLSearchParams({ date: dateKey });
  if (mealPeriodId) {
    params.set("mealPeriodId", mealPeriodId);
  }
  return `/cooking-report?${params.toString()}`;
}

export default async function CookingReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.REPORT_COOKING);

  const params = await searchParams;
  const date = params.date ? parseDateKey(params.date) : addDays(new Date(), 1);
  const mealPeriods = await getMealPeriods();
  const mealPeriodId =
    params.mealPeriodId &&
    mealPeriods.some((period) => period.id === params.mealPeriodId)
      ? params.mealPeriodId
      : undefined;
  const selectedPeriod = mealPeriods.find(
    (period) => period.id === mealPeriodId,
  );
  const report = await getCookingReport(date, { mealPeriodId });
  const dateKey = formatDateKey(date);
  const today = startOfDay(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">آمار پخت</h1>
          <p className="text-muted-foreground text-sm">
            جمع رزروهای فعال برای {formatDisplayDate(date)}
            {selectedPeriod ? ` · ${selectedPeriod.title}` : ""}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {QUICK_DATES.map(({ label, offset }) => {
              const key = formatDateKey(addDays(today, offset));
              const active = key === dateKey;
              return (
                <Button
                  key={key}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  render={<Link href={cookingReportHref(key, mealPeriodId)} />}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <form className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="date">تاریخ</Label>
              <PersianDatePicker
                id="date"
                name="date"
                defaultValue={dateKey}
                placeholder="انتخاب تاریخ"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mealPeriodId">وعده</Label>
              <select
                id="mealPeriodId"
                name="mealPeriodId"
                defaultValue={mealPeriodId ?? ""}
                className="border-input h-8 min-w-36 rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">همه وعده‌ها</option>
                {mealPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.title}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              نمایش
            </Button>
          </form>
        </div>
      </div>

      <p className="text-sm">
        مجموع رزروها: <strong>{report.total}</strong>
      </p>

      <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">وعده</TableHead>
              <TableHead className="text-right">غذا</TableHead>
              <TableHead className="text-center">تعداد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.foodTotals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  برای این روز رزروی نیست.
                </TableCell>
              </TableRow>
            ) : (
              report.foodTotals.map((row) => (
                <TableRow key={`${row.mealPeriodId}-${row.foodId}`}>
                  <TableCell className="text-right">
                    {row.mealPeriodTitle}
                  </TableCell>
                  <TableCell className="text-right">{row.foodTitle}</TableCell>
                  <TableCell className="text-center font-medium">
                    {row.count}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            تفکیک محل تحویل
          </h2>
          <p className="text-muted-foreground text-sm">
            در هر محل تحویل، تعداد هر غذا به تفکیک وعده.
          </p>
        </div>

        {report.locations.length === 0 ? (
          <div className="border-border/70 text-muted-foreground rounded-xl border bg-background/90 p-4 text-sm">
            برای این روز رزروی نیست.
          </div>
        ) : (
          <div className="space-y-4">
            {report.locations.map((location) => (
              <div
                key={location.deliveryLocationId}
                className="border-border/70 overflow-hidden rounded-xl border bg-background/90"
              >
                <div className="border-border/70 flex items-center justify-between gap-3 border-b px-4 py-3">
                  <h3 className="font-medium">
                    {location.deliveryLocationTitle}
                  </h3>
                  <span className="text-muted-foreground text-sm">
                    مجموع: {location.total}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">وعده</TableHead>
                      <TableHead className="text-right">غذا</TableHead>
                      <TableHead className="text-center">تعداد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {location.rows.map((row) => (
                      <TableRow
                        key={`${location.deliveryLocationId}-${row.mealPeriodId}-${row.foodId}`}
                      >
                        <TableCell className="text-right">
                          {row.mealPeriodTitle}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.foodTitle}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {row.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
