"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getUserPermissionCodes } from "@/lib/rbac/permissions";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) {
    return { error: "شماره موبایل و رمز عبور الزامی است." };
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.isActive) {
    return { error: "شماره موبایل یا رمز عبور نادرست است." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "شماره موبایل یا رمز عبور نادرست است." };
  }

  const permissionCodes = await getUserPermissionCodes(user.id);
  const displayName = [user.name, user.lastName].filter(Boolean).join(" ");
  const token = await signSessionToken({
    userId: user.id,
    phone: user.phone,
    name: displayName,
    permissionCodes,
  });
  await setSessionCookie(token);
  redirect("/menu");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
