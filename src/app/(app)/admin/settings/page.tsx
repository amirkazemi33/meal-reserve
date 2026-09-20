import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getCutoffTime } from "@/lib/meals";
import { saveCutoffAction } from "@/app/actions";
import PersianDatePicker from "@/components/common/persian-date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.SETTINGS_CUTOFF);
  const cutoff = await getCutoffTime();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">تنظیمات</h1>
        <p className="text-muted-foreground text-sm">
          ساعت ضرب‌الاجل، زمان نهایی ثبت یا لغو رزرو برای روز بعد است.
        </p>
      </div>

      <form
        action={saveCutoffAction}
        className="border-border/70 flex max-w-md flex-col gap-3 rounded-xl border bg-background/90 p-4"
      >
        <div className="space-y-1">
          <Label htmlFor="cutoff">ساعت ضرب‌الاجل</Label>
          <PersianDatePicker
            id="cutoff"
            name="cutoff"
            defaultValue={cutoff}
            onlyTimePicker
            required
            placeholder="ساعت"
          />
        </div>
        <Button type="submit" className="w-fit">
          ذخیره ضرب‌الاجل
        </Button>
      </form>
    </div>
  );
}
