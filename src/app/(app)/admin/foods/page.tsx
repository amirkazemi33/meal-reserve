import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getFoods } from "@/lib/meals";
import { parseFoodKind } from "@/lib/meals/food-kind";
import { FoodsManagement } from "@/components/admin/foods-management";

export default async function FoodsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.FOOD_MANAGE);
  const foods = await getFoods(false);

  return (
    <FoodsManagement
      foods={foods.map((food) => ({
        id: food.id,
        title: food.title,
        description: food.description,
        kind: parseFoodKind(food.kind),
        isActive: food.isActive,
      }))}
    />
  );
}
