import { getSession } from "@/lib/auth/session";
import { can, redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import {
  formatDateKey,
  formatDisplayDate,
  getDailyMenu,
  getDeliveryLocations,
  listActiveUsersForPicker,
  listOwnedUserListsWithMembers,
  parseDateKey,
} from "@/lib/meals";
import { ReserveForOthers } from "@/components/admin/reserve-for-others";

type SearchParams = Promise<{ date?: string }>;

function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(2020, 0, 1, hours || 0, minutes || 0));
}

export default async function ReserveForOthersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.RESERVATION_FOR_OTHERS);

  const params = await searchParams;
  const date = params.date ? parseDateKey(params.date) : new Date();
  const canUseUserLists = can(session, PermissionCode.USER_LIST_MANAGE);
  const canSelectDeliveryLocation = can(
    session,
    PermissionCode.RESERVATION_SELECT_DELIVERY_LOCATION,
  );
  const canSetQuantity = can(session, PermissionCode.RESERVATION_QUANTITY);

  const [dailyMenu, users, deliveryLocations, userLists] = await Promise.all([
    getDailyMenu(date),
    listActiveUsersForPicker(),
    canSelectDeliveryLocation
      ? getDeliveryLocations(true)
      : Promise.resolve([]),
    canUseUserLists
      ? listOwnedUserListsWithMembers(session!.userId)
      : Promise.resolve([]),
  ]);

  const dateKey = formatDateKey(date);
  const mealPeriods = dailyMenu.mealPeriods
    .map((period) => ({
      id: period.id,
      title: period.title,
      servingLabel: `سرو ${formatClock(period.startTime)} تا ${formatClock(period.endTime)}`,
      foods: dailyMenu.menuItems
        .filter((item) => item.mealPeriodId === period.id)
        .map((item) => ({
          menuItemId: item.id,
          foodId: item.foodId,
          title: item.food.title,
          description: item.food.description,
          kind: item.food.kind,
        })),
    }))
    .filter((period) => period.foods.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          رزرو برای دیگران
        </h1>
        <p className="text-muted-foreground text-sm">
          انتخاب تاریخ، کاربران یا لیست، سپس ثبت یکسان وعده‌ها برای همه.
        </p>
      </div>

      <ReserveForOthers
        key={dateKey}
        dateKey={dateKey}
        displayDate={formatDisplayDate(date)}
        editable={dailyMenu.editable}
        cutoffTime={dailyMenu.cutoffTime}
        mealPeriods={mealPeriods}
        users={users}
        userLists={userLists}
        canUseUserLists={canUseUserLists}
        canSelectDeliveryLocation={canSelectDeliveryLocation}
        canSetQuantity={canSetQuantity}
        deliveryLocations={deliveryLocations.map((location) => ({
          id: location.id,
          title: location.title,
        }))}
      />
    </div>
  );
}
