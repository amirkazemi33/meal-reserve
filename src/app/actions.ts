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
  upsertFeedback,
  upsertReservation,
  setCutoffTime,
} from "@/lib/meals";
import { ReservationStatus } from "@/generated/prisma/client";
import { parseDateKey } from "@/lib/meals/dates";

async function requireAuthedPermission(code: string) {
  const session = await getSession();
  if (!session) throw new Error("عدم احراز هویت");
  requirePermission(session, code);
  return session;
}

export async function reserveMenuItemAction(menuItemId: string) {
  const session = await requireAuthedPermission(
    PermissionCode.RESERVATION_CREATE,
  );
  await upsertReservation({ userId: session.userId, menuItemId });
  revalidatePath("/menu");
  revalidatePath("/history");
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
  const isActive = formData.get("isActive") === "on";

  if (!title) throw new Error("عنوان الزامی است");

  if (id) {
    await prisma.food.update({
      where: { id },
      data: { title, description: description || null, isActive },
    });
  } else {
    await prisma.food.create({
      data: { title, description: description || null, isActive },
    });
  }
  revalidatePath("/admin/foods");
  revalidatePath("/admin/menu");
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
  const isActive = formData.get("isActive") === "on";
  const roleIds = formData.getAll("roleIds").map(String);

  if (!phone || !name || !lastName) {
    throw new Error("شماره موبایل، نام و نام خانوادگی الزامی است");
  }

  if (id) {
    const data: {
      phone: string;
      name: string;
      lastName: string;
      isActive: boolean;
      passwordHash?: string;
    } = { phone, name, lastName, isActive };
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
      data: { phone, name, lastName, passwordHash, isActive },
    });
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: user.id, roleId })),
      });
    }
  }

  revalidatePath("/admin/users");
}

export async function deleteUserAction(userId: string) {
  const session = await requireAuthedPermission(PermissionCode.USERS_MANAGE);
  if (session.userId === userId) {
    throw new Error("نمی‌توانید حساب خود را حذف کنید");
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
