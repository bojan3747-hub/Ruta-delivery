"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavTabs({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-4 border-b border-black/10 pb-3 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "font-medium hover:underline" : "hover:underline"}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
