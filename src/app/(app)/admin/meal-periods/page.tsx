import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getAllMealPeriods } from "@/lib/meals";
import { upsertMealPeriodAction } from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function MealPeriodsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.MEAL_PERIOD_MANAGE);
  const periods = await getAllMealPeriods();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">وعده‌های غذایی</h1>
        <p className="text-muted-foreground text-sm">
          تعریف وعده با عنوان، بازه ساعتی و توضیحات.
        </p>
      </div>

      <form
        action={upsertMealPeriodAction}
        className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-sm font-semibold">افزودن وعده</h2>
        <div className="space-y-1">
          <Label htmlFor="title">عنوان</Label>
          <Input id="title" name="title" required placeholder="ناهار" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sortOrder">ترتیب نمایش</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={0}
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="startTime">شروع</Label>
          <PersianDatePicker
            id="startTime"
            name="startTime"
            onlyTimePicker
            required
            placeholder="۱۲:۰۰"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endTime">پایان</Label>
          <PersianDatePicker
            id="endTime"
            name="endTime"
            onlyTimePicker
            required
            placeholder="۱۴:۰۰"
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="description">توضیحات</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked />
          فعال
        </label>
        <div className="sm:col-span-2">
          <Button type="submit">ایجاد</Button>
        </div>
      </form>

      <div className="space-y-4">
        {periods.map((period) => (
          <form
            key={period.id}
            action={upsertMealPeriodAction}
            className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={period.id} />
            <div className="sm:col-span-2 flex items-center gap-2">
              <Badge variant={period.isActive ? "success" : "secondary"}>
                {period.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label>عنوان</Label>
              <Input name="title" defaultValue={period.title} required />
            </div>
            <div className="space-y-1">
              <Label>ترتیب نمایش</Label>
              <Input
                name="sortOrder"
                type="number"
                defaultValue={period.sortOrder}
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label>شروع</Label>
              <PersianDatePicker
                name="startTime"
                defaultValue={period.startTime}
                onlyTimePicker
                required
                placeholder="۱۲:۰۰"
              />
            </div>
            <div className="space-y-1">
              <Label>پایان</Label>
              <PersianDatePicker
                name="endTime"
                defaultValue={period.endTime}
                onlyTimePicker
                required
                placeholder="۱۴:۰۰"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>توضیحات</Label>
              <Textarea
                name="description"
                rows={2}
                defaultValue={period.description ?? ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={period.isActive}
              />
              فعال
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline">
                ذخیره
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
