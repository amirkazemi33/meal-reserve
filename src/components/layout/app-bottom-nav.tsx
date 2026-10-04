"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavIcon } from "@/components/layout/nav-icon";

type NavItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 overflow-x-auto bg-white/90 shadow-[0_-1px_0_var(--booking-line)] backdrop-blur-xl [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max min-w-full px-2 pt-1 pb-[max(10px,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-w-[4.75rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-0.5"
            >
              <span
                className={cn(
                  "flex h-[30px] w-[52px] items-center justify-center rounded-xl",
                  active
                    ? "bg-booking-fill-soft text-booking"
                    : "text-booking-grey",
                )}
              >
                <NavIcon href={item.href} className="size-5" />
              </span>
              <span
                className={cn(
                  "text-center text-[10px] leading-tight",
                  active ? "text-booking font-medium" : "text-booking-grey",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
