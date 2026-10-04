"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/layout/app-nav";

type NavItem = {
  href: string;
  label: string;
};

export function AppHeader({ name, items }: { name: string; items: NavItem[] }) {
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 bg-white/85 shadow-[0_1px_0_var(--booking-line)] backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link
            href="/menu"
            className="shrink-0"
            aria-label="رزرو غذای سازمانی"
          >
            <Image
              src="/logo.png"
              alt=""
              width={285}
              height={177}
              className="h-[34px] w-auto"
              priority
            />
          </Link>
          <div className="bg-booking-fill h-9 w-px shrink-0" />
          <div className="min-w-0">
            <Link
              href="/menu"
              className="text-booking-heading block truncate text-[15px] leading-tight font-medium"
            >
              رزرو غذای سازمانی
            </Link>
            <p className="text-booking-secondary truncate text-xs">
              سلام، {name}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            خروج
          </Button>
        </form>
      </div>
      <div className="hidden md:block">
        <AppNav items={items} />
      </div>
    </header>
  );
}
