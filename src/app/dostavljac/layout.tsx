import { requireUser } from "@/lib/auth";
import { NavTabs } from "@/components/NavTabs";

const NAV_ITEMS = [
  { href: "/dostavljac", label: "Pregled" },
  { href: "/dostavljac/zahtevi", label: "Zahtevi za ponude" },
  { href: "/dostavljac/aktivne", label: "Aktivne isporuke" },
  { href: "/dostavljac/cenovnik", label: "Cenovnik i zone" },
];

export default async function DostavljacLayout({
  children,
}: LayoutProps<"/dostavljac">) {
  await requireUser("COURIER");

  return (
    <div className="space-y-6">
      <NavTabs items={NAV_ITEMS} />
      {children}
    </div>
  );
}
