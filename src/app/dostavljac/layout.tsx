import { requireUser } from "@/lib/auth";
import { PortalSidebar, type PortalNavItem } from "@/components/PortalSidebar";

const NAV_ITEMS: PortalNavItem[] = [
  { href: "/dostavljac", label: "Pregled", icon: "home" },
  { href: "/dostavljac/zahtevi", label: "Zahtevi za ponude", icon: "clipboardList" },
  { href: "/dostavljac/aktivne", label: "Aktivne isporuke", icon: "truck" },
  { href: "/dostavljac/cenovnik", label: "Cenovnik i zone", icon: "percent" },
  { href: "/dostavljac/fakture", label: "Fakture", icon: "receipt" },
  { href: "/dostavljac/ocene", label: "Ocene", icon: "star" },
];

export default async function DostavljacLayout({
  children,
}: LayoutProps<"/dostavljac">) {
  const user = await requireUser("COURIER");

  return (
    <PortalSidebar user={user} navItems={NAV_ITEMS}>
      {children}
    </PortalSidebar>
  );
}
