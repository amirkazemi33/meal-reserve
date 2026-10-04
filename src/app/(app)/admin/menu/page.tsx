import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  addDays,
  eachDay,
  formatDateKey,
  formatDisplayDate,
  getAllMealPeriods,
  getFoods,
  getMenuForRange,
  parseDateKey,
  startOfWeek,
} from "@/lib/meals";
import { setMenuFoodsAction } from "@/app/actions";
import { FOOD_KIND_OPTIONS } from "@/lib/meals/food-kind";
import { CollapsibleDaySection } from "@/components/admin/collapsible-day-section";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type SearchParams = Promise<{ week?: string }>;

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.MENU_MANAGE);

  const params = await searchParams;
  const anchor = params.week ? parseDateKey(params.week) : new Date();
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 6);
  const [mealPeriods, foods, menuItems] = await Promise.all([
    getAllMealPeriods(),
    getFoods(true),
    getMenuForRange(weekStart, weekEnd),
  ]);

  const days = eachDay(weekStart, weekEnd);
  const todayKey = formatDateKey(new Date());
  const selected = new Set(
    menuItems.map(
      (item) =>
        `${formatDateKey(item.date)}:${item.mealPeriodId}:${item.foodId}`,
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ساخت منو</h1>
          <p className="text-muted-foreground text-sm">
            برای هر روز و وعده، غذا، نوشیدنی، و ماست و سالاد را انتخاب کنید.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/menu?week=${formatDateKey(addDays(weekStart, -7))}`}
            className="border-border rounded-md border px-3 py-1.5 text-sm"
          >
            قبل
          </Link>
          <Link
            href={`/admin/menu?week=${formatDateKey(addDays(weekStart, 7))}`}
            className="border-border rounded-md border px-3 py-1.5 text-sm"
          >
            بعد
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {days.map((date) => {
          const dateKey = formatDateKey(date);
          const isToday = dateKey === todayKey;
          return (
            <CollapsibleDaySection
              key={dateKey}
              dateLabel={formatDisplayDate(date)}
              isToday={isToday}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                {mealPeriods.map((period) => (
                  <form
                    key={`${dateKey}-${period.id}`}
                    action={setMenuFoodsAction}
                    className={
                      isToday
                        ? "space-y-3 rounded-xl border border-emerald-800/15 bg-white/85 p-4 shadow-sm"
                        : "border-border/60 space-y-3 rounded-xl border bg-white/85 p-4 shadow-sm"
                    }
                  >
                    <input type="hidden" name="date" value={dateKey} />
                    <input
                      type="hidden"
                      name="mealPeriodId"
                      value={period.id}
                    />
                    <p className="font-medium">
                      {period.title}{" "}
                      <span
                        className="text-muted-foreground text-xs font-normal"
                        dir="ltr"
                      >
                        {period.startTime}–{period.endTime}
                      </span>
                    </p>
                    <div className="space-y-3">
                      {FOOD_KIND_OPTIONS.map((group) => {
                        const groupFoods = foods.filter(
                          (food) => food.kind === group.value,
                        );
                        if (groupFoods.length === 0) return null;
                        return (
                          <div key={group.value} className="space-y-2">
                            <p className="text-muted-foreground text-xs font-medium">
                              {group.label}
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {groupFoods.map((food) => {
                                const key = `${dateKey}:${period.id}:${food.id}`;
                                return (
                                  <label
                                    key={food.id}
                                    className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      name="foodIds"
                                      value={food.id}
                                      defaultChecked={selected.has(key)}
                                    />
                                    {food.title}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <PendingSubmitButton size="sm" idleLabel="ذخیره این وعده" />
                  </form>
                ))}
              </div>
            </CollapsibleDaySection>
          );
        })}
      </div>

      <form className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="week">پرش به هفته (هر روزی از هفته)</Label>
          <PersianDatePicker
            id="week"
            name="week"
            defaultValue={formatDateKey(weekStart)}
            placeholder="انتخاب تاریخ"
          />
        </div>
        <Button type="submit" variant="outline">
          برو
        </Button>
      </form>
    </div>
  );
}
