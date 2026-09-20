import type { SessionPayload } from "@/lib/auth/session";
import type { PermissionCodeValue } from "@/lib/auth/constants";
import { redirect } from "next/navigation";

export function can(
  session: SessionPayload | null | undefined,
  code: PermissionCodeValue | string,
): boolean {
  if (!session) return false;
  return session.permissionCodes.includes(code);
}

export function canAny(
  session: SessionPayload | null | undefined,
  codes: readonly (PermissionCodeValue | string)[],
): boolean {
  return codes.some((code) => can(session, code));
}

export function requirePermission(
  session: SessionPayload | null | undefined,
  code: PermissionCodeValue | string,
): void {
  if (!can(session, code)) {
    throw new Error("دسترسی مجاز نیست");
  }
}

export function redirectUnlessPermission(
  session: SessionPayload | null | undefined,
  code: PermissionCodeValue | string,
  fallback = "/menu",
): asserts session is SessionPayload {
  if (!session) {
    redirect("/login");
  }
  if (!can(session, code)) {
    redirect(fallback);
  }
}
