"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavItem({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm transition ${
        isActive
          ? "bg-red-900/40 text-red-200"
          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
      }`}
    >
      {children}
    </Link>
  );
}
