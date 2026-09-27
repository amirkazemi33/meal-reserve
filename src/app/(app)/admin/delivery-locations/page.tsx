import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getDeliveryLocations } from "@/lib/meals";
import { upsertDeliveryLocationAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default async function DeliveryLocationsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.DELIVERY_LOCATION_MANAGE);
  const locations = await getDeliveryLocations(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">محل‌های تحویل</h1>
        <p className="text-muted-foreground text-sm">
          فهرست محل‌هایی که غذا در آن‌ها تحویل داده می‌شود.
        </p>
      </div>

      <form
        action={upsertDeliveryLocationAction}
        className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4"
      >
        <h2 className="text-sm font-semibold">افزودن محل تحویل</h2>
        <div className="space-y-1">
          <Label htmlFor="title">عنوان</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">آدرس</Label>
          <Input id="address" name="address" required />
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
        {locations.map((location) => (
          <form
            key={location.id}
            action={upsertDeliveryLocationAction}
            className="border-border/70 grid gap-3 rounded-xl border bg-background/90 p-4"
          >
            <input type="hidden" name="id" value={location.id} />
            <div className="flex items-center gap-2">
              <Badge variant={location.isActive ? "success" : "secondary"}>
                {location.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label>عنوان</Label>
              <Input name="title" defaultValue={location.title} required />
            </div>
            <div className="space-y-1">
              <Label>آدرس</Label>
              <Input name="address" defaultValue={location.address} required />
            </div>
            <div className="space-y-1">
              <Label>توضیحات</Label>
              <Textarea
                name="description"
                rows={2}
                defaultValue={location.description ?? ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={location.isActive}
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
