import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { can } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  permission?: string;
};

const NAV: NavItem[] = [
  { href: "/menu", label: "منو", permission: PermissionCode.RESERVATION_CREATE },
  { href: "/history", label: "سابقه", permission: PermissionCode.RESERVATION_CREATE },
  { href: "/feedback", label: "نظرات", permission: PermissionCode.FEEDBACK_CREATE },
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
  { href: "/admin/foods", label: "غذاها", permission: PermissionCode.FOOD_MANAGE },
  { href: "/admin/menu", label: "ساخت منو", permission: PermissionCode.MENU_MANAGE },
  { href: "/admin/users", label: "کاربران", permission: PermissionCode.USERS_MANAGE },
  { href: "/admin/roles", label: "نقش‌ها", permission: PermissionCode.ROLES_MANAGE },
  {
    href: "/admin/reports",
    label: "گزارش‌ها",
    permission: PermissionCode.REPORT_RESERVATIONS,
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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[linear-gradient(180deg,#f4faf7_0%,#fafafa_40%,#fff8f0_100%)]">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/menu" className="text-lg font-semibold tracking-tight">
              رزرو غذا
            </Link>
            <p className="text-muted-foreground text-sm">
              {session.name} · {session.phone}
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              خروج
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
