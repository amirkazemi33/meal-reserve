import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import { AppHeader } from "@/components/layout/app-header";

type NavItem = {
  href: string;
  label: string;
  permission?: string;
};

const NAV: NavItem[] = [
  {
    href: "/menu",
    label: "منو",
    permission: PermissionCode.RESERVATION_CREATE,
  },
  {
    href: "/history",
    label: "سابقه",
    permission: PermissionCode.RESERVATION_CREATE,
  },
  {
    href: "/feedback",
    label: "نظرات",
    permission: PermissionCode.FEEDBACK_CREATE,
  },
  {
    href: "/cooking-report",
    label: "آمار پخت",
    permission: PermissionCode.REPORT_COOKING,
  },
  {
    href: "/admin/meal-periods",
    label: "وعده‌ها",
    permission: PermissionCode.MEAL_PERIOD_MANAGE,
  },
  {
    href: "/admin/foods",
    label: "غذاها",
    permission: PermissionCode.FOOD_MANAGE,
  },
  {
    href: "/admin/delivery-locations",
    label: "محل‌های تحویل",
    permission: PermissionCode.DELIVERY_LOCATION_MANAGE,
  },
  {
    href: "/admin/menu",
    label: "ساخت منو",
    permission: PermissionCode.MENU_MANAGE,
  },
  {
    href: "/admin/users",
    label: "کاربران",
    permission: PermissionCode.USERS_MANAGE,
  },
  {
    href: "/admin/user-lists",
    label: "لیست کاربر",
    permission: PermissionCode.USER_LIST_MANAGE,
  },
  {
    href: "/admin/roles",
    label: "نقش‌ها",
    permission: PermissionCode.ROLES_MANAGE,
  },
  {
    href: "/admin/reports",
    label: "مدیریت رزروها",
    permission: PermissionCode.REPORT_RESERVATIONS,
  },
  {
    href: "/admin/feedback",
    label: "مدیریت نظرات و پیشنهادات",
    permission: PermissionCode.FEEDBACK_MANAGE,
  },
  {
    href: "/admin/reserve-for",
    label: "رزرو برای دیگران",
    permission: PermissionCode.RESERVATION_FOR_OTHERS,
  },
  {
    href: "/admin/settings",
    label: "تنظیمات",
    permission: PermissionCode.SETTINGS_CUTOFF,
  },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const items = NAV.filter(
    (item) => !item.permission || can(session, item.permission),
  );

  const navItems = items.map(({ href, label }) => ({ href, label }));

  return (
    <div className="bg-booking-page flex min-h-full flex-1 flex-col">
      <AppHeader name={session.name} items={navItems} />
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-4 pb-24 md:pb-6">
        {children}
      </main>
      <AppBottomNav items={navItems} />
    </div>
  );
}
