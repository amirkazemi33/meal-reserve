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

export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-[90rem] gap-1 overflow-x-auto px-4 pb-3">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors",
              active
                ? "text-booking bg-white font-medium shadow-[0_2px_8px_rgb(16_32_64/0.1)]"
                : "text-booking-grey hover:text-booking",
            )}
            aria-current={active ? "page" : undefined}
          >
            <NavIcon href={item.href} className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
