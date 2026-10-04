import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  addDays,
  formatDateKey,
  formatDisplayDate,
  getAllMealPeriods,
  getFeedbackReport,
  parseDateKey,
  startOfDay,
} from "@/lib/meals";
import { FeedbackReportTable } from "@/components/admin/feedback-report-table";

type SearchParams = Promise<{ date?: string; to?: string }>;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.FEEDBACK_MANAGE);

  const params = await searchParams;
  const today = startOfDay(new Date());
  const fromDate = params.date ? parseDateKey(params.date) : addDays(today, -6);
  let toDate = params.to ? parseDateKey(params.to) : today;
  if (toDate < fromDate) {
    toDate = fromDate;
  }

  const [rows, mealPeriods] = await Promise.all([
    getFeedbackReport(fromDate, toDate),
    getAllMealPeriods(),
  ]);

  const fromKey = formatDateKey(fromDate);
  const toKey = formatDateKey(toDate);
  const rangeLabel =
    fromKey === toKey
      ? formatDisplayDate(fromDate)
      : `${formatDisplayDate(fromDate)} تا ${formatDisplayDate(toDate)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          مدیریت نظرات و پیشنهادات
        </h1>
        <p className="text-muted-foreground text-sm">
          نظر و امتیاز کاربران برای وعده‌های {rangeLabel}.
        </p>
      </div>

      <FeedbackReportTable
        rows={rows}
        fromDateKey={fromKey}
        toDateKey={toKey}
        mealPeriods={mealPeriods.map((period) => ({
          id: period.id,
          title: period.title,
        }))}
      />
    </div>
  );
}
