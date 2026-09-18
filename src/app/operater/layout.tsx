import { requireUser } from "@/lib/auth";
import { PortalSidebar, type PortalNavItem } from "@/components/PortalSidebar";

const NAV_ITEMS: PortalNavItem[] = [
  { href: "/operater", label: "Pregled", icon: "home" },
  { href: "/operater/porudzbine", label: "Porudžbine", icon: "clipboardList" },
  { href: "/operater/klijenti", label: "Klijenti", icon: "users" },
  { href: "/operater/dostavljaci", label: "Dostavljači", icon: "truck" },
  { href: "/operater/provizija", label: "Provizija", icon: "percent" },
  { href: "/operater/opsti-uslovi", label: "Opšti uslovi", icon: "fileText" },
  { href: "/operater/reset-lozinke", label: "Reset lozinke", icon: "keyRound" },
];

export default async function OperaterLayout({
  children,
}: LayoutProps<"/operater">) {
  const user = await requireUser("OPERATOR");

  return (
    <PortalSidebar user={user} navItems={NAV_ITEMS}>
      {children}
    </PortalSidebar>
  );
}
