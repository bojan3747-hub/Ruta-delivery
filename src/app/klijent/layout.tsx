import { requireUser } from "@/lib/auth";
import { PortalSidebar, type PortalNavItem } from "@/components/PortalSidebar";

const NAV_ITEMS: PortalNavItem[] = [
  { href: "/klijent", label: "Pregled", icon: "home" },
  { href: "/klijent/nova-posiljka", label: "Nova pošiljka", icon: "package" },
  { href: "/klijent/adrese", label: "Sačuvane adrese", icon: "mapPin" },
  { href: "/klijent/ocene", label: "Ocene o meni", icon: "star" },
];

export default async function KlijentLayout({
  children,
}: LayoutProps<"/klijent">) {
  const user = await requireUser("CLIENT");
  return (
    <PortalSidebar user={user} navItems={NAV_ITEMS}>
      {children}
    </PortalSidebar>
  );
}
