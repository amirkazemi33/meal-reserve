import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getCookingReport,
  parseDateKey,
} from "@/lib/meals";
import PersianDatePicker from "@/components/common/persian-date-picker";
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

type SearchParams = Promise<{ date?: string }>;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.REPORT_RESERVATIONS);

  const params = await searchParams;
  const date = params.date ? parseDateKey(params.date) : new Date();
  const report = await getCookingReport(date);
  const dateKey = formatDateKey(date);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            گزارش رزروها
          </h1>
          <p className="text-muted-foreground text-sm">
            تعداد رزرو به تفکیک غذا برای {formatDisplayDate(date)}.
          </p>
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

      <p className="text-sm">
        مجموع: <strong>{report.total}</strong>
      </p>

      <div className="border-border/70 overflow-hidden rounded-xl border bg-background/90">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>وعده</TableHead>
              <TableHead>غذا</TableHead>
              <TableHead className="text-end">رزروشده</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  داده‌ای نیست.
                </TableCell>
              </TableRow>
            ) : (
              report.rows.map((row) => (
                <TableRow key={`${row.mealPeriodId}-${row.foodId}`}>
                  <TableCell>{row.mealPeriodTitle}</TableCell>
                  <TableCell>{row.foodTitle}</TableCell>
                  <TableCell className="text-end">{row.count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
