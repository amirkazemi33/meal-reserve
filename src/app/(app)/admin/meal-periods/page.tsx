import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getAllMealPeriods } from "@/lib/meals";
import { MealPeriodsManagement } from "@/components/admin/meal-periods-management";

export default async function MealPeriodsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.MEAL_PERIOD_MANAGE);
  const periods = await getAllMealPeriods();

  return (
    <MealPeriodsManagement
      periods={periods.map((period) => ({
        id: period.id,
        title: period.title,
        startTime: period.startTime,
        endTime: period.endTime,
        description: period.description,
        isActive: period.isActive,
        sortOrder: period.sortOrder,
      }))}
    />
  );
}
