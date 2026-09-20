import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (can(session, PermissionCode.RESERVATION_CREATE)) {
    redirect("/menu");
  }
  if (can(session, PermissionCode.MENU_MANAGE)) {
    redirect("/admin/menu");
  }
  if (can(session, PermissionCode.REPORT_COOKING)) {
    redirect("/cooking-report");
  }
  redirect("/login");
}
