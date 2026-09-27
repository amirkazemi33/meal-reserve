"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { PermissionCode } from "@/lib/auth/constants";
import { can, requirePermission } from "@/lib/rbac/can";
import { hashPassword } from "@/lib/auth/password";
import {
  cancelReservation,
  updateReservationStatus,
  updateReservationDeliveryLocation,
  updateAdminReservation,
  upsertFeedback,
  upsertReservation,
  upsertReservationsForOthers,
  resolveActiveUserIdsForProxyReserve,
  setCutoffTime,
  upsertDeliveryLocation,
  upsertUserList,
  deleteUserList,
  addUserListMember,
  removeUserListMember,
  syncUserListMembers,
} from "@/lib/meals";
import { ReservationStatus } from "@/generated/prisma/client";
import { parseDateKey } from "@/lib/meals/dates";
import { parseFoodKind } from "@/lib/meals/food-kind";

async function requireAuthedPermission(code: string) {
  const session = await getSession();
  if (!session) throw new Error("عدم احراز هویت");
  requirePermission(session, code);
  return session;
}

export async function reserveMenuItemAction(
  menuItemId: string,
  deliveryLocationId?: string | null,
  drinkMenuItemId?: string | null,
  sideMenuItemId?: string | null,
  quantity?: number | null,
) {
  const session = await requireAuthedPermission(
    PermissionCode.RESERVATION_CREATE,
  );
  const canSelectDeliveryLocation = can(
    session,
    PermissionCode.RESERVATION_SELECT_DELIVERY_LOCATION,
  );
  const canSetQuantity = can(session, PermissionCode.RESERVATION_QUANTITY);
  await upsertReservation({
    userId: session.userId,
    menuItemId,
    deliveryLocationId: canSelectDeliveryLocation ? deliveryLocationId : null,
    canSelectDeliveryLocation,
    drinkMenuItemId,
    sideMenuItemId,
    quantity: canSetQuantity ? quantity : null,
    canSetQuantity,
  });
  revalidatePath("/menu");
  revalidatePath("/history");
  revalidatePath("/admin/reports");
  revalidatePath("/cooking-report");
}

export async function reserveForOthersAction(input: {
  userIds?: string[];
  userListId?: string | null;
  entries: Array<{
    userId: string;
    deliveryLocationId?: string | null;
    quantity?: number | null;
    selections: Array<{
      menuItemId: string;
      drinkMenuItemId?: string | null;
      sideMenuItemId?: string | null;
    }>;
  }>;
}) {
  const session = await requireAuthedPermission(
    PermissionCode.RESERVATION_FOR_OTHERS,
  );

  if (input.userListId) {
    requirePermission(session, PermissionCode.USER_LIST_MANAGE);
  }

  const canSelectDeliveryLocation = can(
    session,
    PermissionCode.RESERVATION_SELECT_DELIVERY_LOCATION,
  );
  const canSetQuantity = can(session, PermissionCode.RESERVATION_QUANTITY);

  const allowedUserIds = new Set(
    await resolveActiveUserIdsForProxyReserve({
      ownerId: session.userId,
      userIds: input.userIds,
      userListId: input.userListId,
    }),
  );

  const entries = input.entries.filter((entry) =>
    allowedUserIds.has(entry.userId),
  );

  if (entries.length === 0) {
    throw new Error("حداقل یک کاربر معتبر انتخاب کنید");
  }

  const result = await upsertReservationsForOthers({
    entries: entries.map((entry) => ({
      userId: entry.userId,
      selections: entry.selections,
      deliveryLocationId: canSelectDeliveryLocation
        ? entry.deliveryLocationId
        : null,
      quantity: canSetQuantity ? entry.quantity : null,
    })),
    canSelectDeliveryLocation,
    canSetQuantity,
  });

  revalidatePath("/menu");
  revalidatePath("/history");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reserve-for");
  revalidatePath("/cooking-report");

  return result;
}

export async function cancelReservationAction(reservationId: string) {
  const session = await requireAuthedPermission(
    PermissionCode.RESERVATION_CANCEL,
  );
  await cancelReservation({ userId: session.userId, reservationId });
  revalidatePath("/menu");
  revalidatePath("/history");
}

export async function setReservationStatusAction(
  reservationId: string,
  status: "ACTIVE" | "CANCELLED",
) {
  const session = await getSession();
  if (!session) throw new Error("عدم احراز هویت");

  const asAdmin = can(session, PermissionCode.REPORT_RESERVATIONS);
  if (!asAdmin) {
    requirePermission(session, PermissionCode.RESERVATION_CANCEL);
  }

  await updateReservationStatus({
    reservationId,
    status:
      status === "ACTIVE"
        ? ReservationStatus.ACTIVE
        : ReservationStatus.CANCELLED,
    userId: session.userId,
    asAdmin,
  });
  revalidatePath("/menu");
  revalidatePath("/history");
  revalidatePath("/admin/reports");
  revalidatePath("/cooking-report");
}

export async function updateReservationDeliveryLocationAction(
  reservationId: string,
  deliveryLocationId: string,
) {
  await requireAuthedPermission(PermissionCode.REPORT_RESERVATIONS);
  await updateReservationDeliveryLocation({
    reservationId,
    deliveryLocationId,
  });
  revalidatePath("/menu");
  revalidatePath("/history");
  revalidatePath("/admin/reports");
  revalidatePath("/cooking-report");
}

export async function updateAdminReservationAction(
  reservationId: string,
  menuItemId: string,
  deliveryLocationId: string,
  drinkMenuItemId?: string | null,
  sideMenuItemId?: string | null,
  quantity?: number | null,
) {
  const session = await requireAuthedPermission(
    PermissionCode.REPORT_RESERVATIONS,
  );
  const canSetQuantity = can(session, PermissionCode.RESERVATION_QUANTITY);
  await updateAdminReservation({
    reservationId,
    menuItemId,
    deliveryLocationId,
    drinkMenuItemId,
    sideMenuItemId,
    quantity: canSetQuantity ? quantity : null,
    canSetQuantity,
  });
  revalidatePath("/menu");
  revalidatePath("/history");
  revalidatePath("/admin/reports");
  revalidatePath("/cooking-report");
}

export async function saveFeedbackAction(formData: FormData) {
  const session = await requireAuthedPermission(PermissionCode.FEEDBACK_CREATE);
  const reservationId = String(formData.get("reservationId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "");
  await upsertFeedback({
    userId: session.userId,
    reservationId,
    rating,
    comment,
  });
  revalidatePath("/feedback");
  revalidatePath("/history");
}

export async function saveCutoffAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.SETTINGS_CUTOFF);
  const value = String(formData.get("cutoff") ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("ساعت ضرب‌الاجل باید به صورت HH:mm باشد");
  }
  await setCutoffTime(value);
  revalidatePath("/admin/settings");
  revalidatePath("/menu");
}

export async function upsertMealPeriodAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.MEAL_PERIOD_MANAGE);
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";

  if (!title || !startTime || !endTime) {
    throw new Error("عنوان و بازه زمانی الزامی است");
  }

  if (id) {
    await prisma.mealPeriod.update({
      where: { id },
      data: {
        title,
        startTime,
        endTime,
        description: description || null,
        sortOrder,
        isActive,
      },
    });
  } else {
    await prisma.mealPeriod.create({
      data: {
        title,
        startTime,
        endTime,
        description: description || null,
        sortOrder,
        isActive,
      },
    });
  }
  revalidatePath("/admin/meal-periods");
  revalidatePath("/menu");
}

export async function upsertFoodAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.FOOD_MANAGE);
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const kind = parseFoodKind(String(formData.get("kind") ?? ""));
  const isActive = formData.get("isActive") === "on";

  if (!title) throw new Error("عنوان الزامی است");

  if (id) {
    await prisma.food.update({
      where: { id },
      data: { title, description: description || null, kind, isActive },
    });
  } else {
    await prisma.food.create({
      data: { title, description: description || null, kind, isActive },
    });
  }
  revalidatePath("/admin/foods");
  revalidatePath("/admin/menu");
}

export async function deleteFoodAction(
  foodId: string,
): Promise<{ error: string } | void> {
  await requireAuthedPermission(PermissionCode.FOOD_MANAGE);
  const id = foodId.trim();
  if (!id) return { error: "غذا پیدا نشد" };

  const food = await prisma.food.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { reservations: true } },
    },
  });

  if (!food) return { error: "غذا پیدا نشد" };

  if (food._count.reservations > 0) {
    return { error: "این غذا در رزروها استفاده شده و قابل حذف نیست." };
  }

  await prisma.food.delete({ where: { id } });
  revalidatePath("/admin/foods");
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function upsertDeliveryLocationAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.DELIVERY_LOCATION_MANAGE);
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!title || !address) {
    throw new Error("عنوان و آدرس الزامی است");
  }

  await upsertDeliveryLocation({
    id: id || undefined,
    title,
    address,
    description: description || null,
    isActive,
  });

  revalidatePath("/admin/delivery-locations");
  revalidatePath("/admin/users");
  revalidatePath("/menu");
}

export async function setMenuFoodsAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.MENU_MANAGE);
  const dateKey = String(formData.get("date") ?? "");
  const mealPeriodId = String(formData.get("mealPeriodId") ?? "");
  const foodIds = formData.getAll("foodIds").map(String);

  if (!dateKey || !mealPeriodId) {
    throw new Error("تاریخ و وعده الزامی است");
  }

  const date = parseDateKey(dateKey);

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.deleteMany({
      where: { date, mealPeriodId },
    });
    if (foodIds.length > 0) {
      await tx.menuItem.createMany({
        data: foodIds.map((foodId) => ({
          date,
          mealPeriodId,
          foodId,
        })),
      });
    }
  });

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function upsertUserAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.USERS_MANAGE);
  const id = String(formData.get("id") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const deliveryLocationId = String(
    formData.get("deliveryLocationId") ?? "",
  ).trim();
  const isActive = formData.get("isActive") === "on";
  const roleIds = formData.getAll("roleIds").map(String);

  if (!phone || !name || !lastName) {
    throw new Error("شماره موبایل، نام و نام خانوادگی الزامی است");
  }

  if (!deliveryLocationId) {
    throw new Error("محل تحویل الزامی است");
  }

  const location = await prisma.deliveryLocation.findUnique({
    where: { id: deliveryLocationId },
    select: { id: true },
  });
  if (!location) {
    throw new Error("محل تحویل معتبر نیست");
  }

  if (id) {
    const data: {
      phone: string;
      name: string;
      lastName: string;
      isActive: boolean;
      deliveryLocationId: string;
      passwordHash?: string;
    } = { phone, name, lastName, isActive, deliveryLocationId };
    if (password) {
      data.passwordHash = await hashPassword(password);
    }
    await prisma.user.update({ where: { id }, data });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    }
  } else {
    if (!password) throw new Error("رمز عبور برای کاربر جدید الزامی است");
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phone,
        name,
        lastName,
        passwordHash,
        isActive,
        deliveryLocationId,
      },
    });
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: user.id, roleId })),
      });
    }
  }

  revalidatePath("/admin/users");
}

export async function deleteUserAction(
  userId: string,
): Promise<{ error: string } | void> {
  const session = await requireAuthedPermission(PermissionCode.USERS_MANAGE);
  if (session.userId === userId) {
    return { error: "نمی‌توانید حساب خود را حذف کنید" };
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function upsertRoleAction(formData: FormData) {
  await requireAuthedPermission(PermissionCode.ROLES_MANAGE);
  const id = String(formData.get("id") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const permissionIds = formData.getAll("permissionIds").map(String);

  if (!code || !name) throw new Error("کد و نام الزامی است");

  let roleId = id;
  if (id) {
    await prisma.role.update({
      where: { id },
      data: { code, name, description: description || null },
    });
  } else {
    const role = await prisma.role.create({
      data: { code, name, description: description || null },
    });
    roleId = role.id;
  }

  await prisma.rolePermission.deleteMany({ where: { roleId } });
  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
    });
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
}

export async function deleteRoleAction(
  roleId: string,
): Promise<{ error: string } | void> {
  await requireAuthedPermission(PermissionCode.ROLES_MANAGE);

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      _count: { select: { users: true } },
    },
  });

  if (!role) {
    return { error: "نقش پیدا نشد" };
  }

  if (role._count.users > 0) {
    return {
      error: `این نقش به ${role._count.users} کاربر اختصاص دارد و قابل حذف نیست.`,
    };
  }

  await prisma.role.delete({ where: { id: roleId } });
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
}

export async function upsertUserListAction(formData: FormData) {
  const session = await requireAuthedPermission(
    PermissionCode.USER_LIST_MANAGE,
  );
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    throw new Error("عنوان لیست الزامی است");
  }

  const list = await upsertUserList({
    ownerId: session.userId,
    id: id || undefined,
    title,
    description: description || null,
  });

  revalidatePath("/admin/user-lists");
  revalidatePath(`/admin/user-lists/${list.id}`);
  revalidatePath("/admin/reports");
}

export async function deleteUserListAction(listId: string) {
  const session = await requireAuthedPermission(
    PermissionCode.USER_LIST_MANAGE,
  );
  await deleteUserList(session.userId, listId);
  revalidatePath("/admin/user-lists");
  revalidatePath("/admin/reports");
}

export async function addUserListMemberAction(listId: string, userId: string) {
  const session = await requireAuthedPermission(
    PermissionCode.USER_LIST_MANAGE,
  );
  await addUserListMember({
    ownerId: session.userId,
    listId,
    userId,
  });
  revalidatePath("/admin/user-lists");
  revalidatePath(`/admin/user-lists/${listId}`);
  revalidatePath("/admin/reports");
}

export async function removeUserListMemberAction(
  listId: string,
  userId: string,
) {
  const session = await requireAuthedPermission(
    PermissionCode.USER_LIST_MANAGE,
  );
  await removeUserListMember({
    ownerId: session.userId,
    listId,
    userId,
  });
  revalidatePath("/admin/user-lists");
  revalidatePath(`/admin/user-lists/${listId}`);
  revalidatePath("/admin/reports");
}

export async function syncUserListMembersAction(
  listId: string,
  selectedUserIds: string[],
) {
  const session = await requireAuthedPermission(
    PermissionCode.USER_LIST_MANAGE,
  );
  await syncUserListMembers({
    ownerId: session.userId,
    listId,
    selectedUserIds,
  });
  revalidatePath("/admin/user-lists");
  revalidatePath(`/admin/user-lists/${listId}`);
  revalidatePath("/admin/reports");
}
