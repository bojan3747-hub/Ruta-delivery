"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth-actions";
import { BackButton } from "./BackButton";
import {
  LogOutIcon,
  MenuIcon,
  XIcon,
  HomeIcon,
  PackageIcon,
  MapPinIcon,
  StarIcon,
  ClipboardListIcon,
  TruckIcon,
  PercentIcon,
  ReceiptIcon,
  UsersIcon,
  FileTextIcon,
  KeyRoundIcon,
} from "./icons";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Klijent",
  COURIER: "Dostavljač",
  OPERATOR: "Operater",
};

// Layout.tsx fajlovi su Server Component-e, a PortalSidebar je Client
// Component — funkcije (React komponente ikonica) ne mogu da pređu tu
// granicu kao prop, pa svaki nav item nosi samo STRING ključ ikonice, a
// mapiranje ključ→komponenta živi ovde, unutar client modula.
const ICONS = {
  home: HomeIcon,
  package: PackageIcon,
  mapPin: MapPinIcon,
  star: StarIcon,
  clipboardList: ClipboardListIcon,
  truck: TruckIcon,
  percent: PercentIcon,
  receipt: ReceiptIcon,
  users: UsersIcon,
  fileText: FileTextIcon,
  keyRound: KeyRoundIcon,
} as const;

export type PortalIconName = keyof typeof ICONS;

export interface PortalNavItem {
  href: string;
  label: string;
  icon: PortalIconName;
}

/**
 * Faza 13 (deo 2): tamna bočna navigacija za tri autentifikovana portala
 * (klijent/dostavljač/operater), po Figma dizajnu — zamenjuje raniji gornji
 * NavBar + NavTabs unutar ovih portala (javne strane i dalje koriste NavBar,
 * vidi src/app/(public)/layout.tsx). Na uskim ekranima se pretvara u gornju
 * traku sa hamburger-meni koji otvara isti sadržaj kao overlay.
 */
export function PortalSidebar({
  user,
  navItems,
  children,
}: {
  user: { ime: string; role: string };
  navItems: PortalNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = user.ime.trim().charAt(0).toUpperCase() || "?";

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
          R
        </span>
        <span className="font-serif text-lg font-semibold text-white">
          Ruta-Dostava
        </span>
      </div>

      <div className="mx-3 mb-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user.ime}</p>
          <p className="text-xs text-slate-400">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const ItemIcon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <ItemIcon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOutIcon className="h-4 w-4" />
            Odjavi se
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-50 lg:flex">
      {/* mobilna gornja traka */}
      <div className="flex items-center justify-between border-b border-black/10 bg-slate-900 px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
            R
          </span>
          <span className="font-serif text-base font-semibold text-white">
            Ruta-Dostava
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Otvori meni"
          className="rounded-md p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* mobilni overlay meni */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900 pb-4">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zatvori meni"
                className="rounded-md p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      {/* desktop bočna navigacija */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:bg-slate-900 lg:pb-4">
        {navContent}
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <BackButton />
          {children}
        </main>
      </div>
    </div>
  );
}
