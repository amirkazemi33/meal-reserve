import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getFoods } from "@/lib/meals";
import { upsertFoodAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default async function FoodsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.FOOD_MANAGE);
  const foods = await getFoods(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">غذاها</h1>
        <p className="text-muted-foreground text-sm">
          فهرست غذاهایی که می‌توانند در منو قرار گیرند.
        </p>
      </div>

      <form
        action={upsertFoodAction}
        className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4"
      >
        <h2 className="text-sm font-semibold">افزودن غذا</h2>
        <div className="space-y-1">
          <Label htmlFor="title">عنوان</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">توضیحات</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked />
          فعال
        </label>
        <Button type="submit" className="w-fit">
          ایجاد
        </Button>
      </form>

      <div className="space-y-3">
        {foods.map((food) => (
          <form
            key={food.id}
            action={upsertFoodAction}
            className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4"
          >
            <input type="hidden" name="id" value={food.id} />
            <div className="flex items-center gap-2">
              <Badge variant={food.isActive ? "success" : "secondary"}>
                {food.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label>عنوان</Label>
              <Input name="title" defaultValue={food.title} required />
            </div>
            <div className="space-y-1">
              <Label>توضیحات</Label>
              <Textarea
                name="description"
                rows={2}
                defaultValue={food.description ?? ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={food.isActive}
              />
              فعال
            </label>
            <Button type="submit" variant="outline" className="w-fit">
              ذخیره
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
