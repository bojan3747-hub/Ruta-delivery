import { requireUser } from "@/lib/auth";
import { NavTabs } from "@/components/NavTabs";

const NAV_ITEMS = [
  { href: "/operater", label: "Pregled" },
  { href: "/operater/dostavljaci", label: "Dostavljači" },
  { href: "/operater/provizija", label: "Provizija" },
];

export default async function OperaterLayout({
  children,
}: LayoutProps<"/operater">) {
  await requireUser("OPERATOR");

  return (
    <div className="space-y-6">
      <NavTabs items={NAV_ITEMS} />
      {children}
    </div>
  );
}
