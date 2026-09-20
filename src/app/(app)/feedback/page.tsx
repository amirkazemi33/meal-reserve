import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { formatDisplayDate, getFeedbackCandidates } from "@/lib/meals";
import { saveFeedbackAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Promise<{ days?: string }>;

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, PermissionCode.FEEDBACK_CREATE)) redirect("/menu");

  const params = await searchParams;
  const daysBack = Number(params.days ?? 7) || 7;
  const rows = await getFeedbackCandidates(session.userId, daysBack);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">نظرات و امتیاز</h1>
          <p className="text-muted-foreground text-sm">
            به غذاهای بازه انتخابی امتیاز دهید (پیش‌فرض ۷ روز گذشته).
          </p>
        </div>
        <form className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="days">تعداد روز</Label>
            <Input
              id="days"
              name="days"
              type="number"
              min={1}
              max={90}
              defaultValue={daysBack}
              className="w-24"
              dir="ltr"
            />
          </div>
          <Button type="submit" variant="outline">
            اعمال فیلتر
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            در این بازه رزروی وجود ندارد.
          </p>
        ) : (
          rows.map((row) => (
            <form
              key={row.id}
              action={saveFeedbackAction}
              className="border-border/70 space-y-3 rounded-xl border bg-background/90 p-4"
            >
              <input type="hidden" name="reservationId" value={row.id} />
              <div>
                <p className="font-medium">
                  {formatDisplayDate(row.date)} · {row.mealPeriod.title}
                </p>
                <p className="text-muted-foreground text-sm">{row.food.title}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end">
                <div className="space-y-1">
                  <Label htmlFor={`rating-${row.id}`}>امتیاز (۱ تا ۵)</Label>
                  <Input
                    id={`rating-${row.id}`}
                    name="rating"
                    type="number"
                    min={1}
                    max={5}
                    required
                    defaultValue={row.feedback?.rating ?? 5}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`comment-${row.id}`}>نظر</Label>
                  <Textarea
                    id={`comment-${row.id}`}
                    name="comment"
                    rows={2}
                    defaultValue={row.feedback?.comment ?? ""}
                    placeholder="اختیاری"
                  />
                </div>
                <Button type="submit">
                  {row.feedback ? "به‌روزرسانی" : "ثبت"}
                </Button>
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
