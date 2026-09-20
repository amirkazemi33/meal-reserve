import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getCookingReport,
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

type SearchParams = Promise<{ date?: string }>;

const QUICK_DATES = [
  { label: "امروز", offset: 0 },
  { label: "فردا", offset: 1 },
  { label: "پس فردا", offset: 2 },
] as const;

export default async function CookingReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.REPORT_COOKING);

  const params = await searchParams;
  const date = params.date ? parseDateKey(params.date) : addDays(new Date(), 1);
  const report = await getCookingReport(date);
  const dateKey = formatDateKey(date);
  const today = startOfDay(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">آمار پخت</h1>
          <p className="text-muted-foreground text-sm">
            جمع رزروهای فعال برای {formatDisplayDate(date)}.
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
                  render={<Link href={`/cooking-report?date=${key}`} />}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <form className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="date">تاریخ</Label>
              <PersianDatePicker
                id="date"
                name="date"
                defaultValue={dateKey}
                placeholder="انتخاب تاریخ"
              />
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
              <TableHead>وعده</TableHead>
              <TableHead>غذا</TableHead>
              <TableHead className="text-end">تعداد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  برای این روز رزروی نیست.
                </TableCell>
              </TableRow>
            ) : (
              report.rows.map((row) => (
                <TableRow key={`${row.mealPeriodId}-${row.foodId}`}>
                  <TableCell>{row.mealPeriodTitle}</TableCell>
                  <TableCell>{row.foodTitle}</TableCell>
                  <TableCell className="text-end font-medium">{row.count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
