import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function DostavljacLayout({
  children,
}: LayoutProps<"/dostavljac">) {
  await requireUser("COURIER");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 border-b border-black/10 pb-3 text-sm">
        <Link href="/dostavljac" className="font-medium hover:underline">
          Pregled
        </Link>
        <Link href="/dostavljac/zahtevi" className="hover:underline">
          Zahtevi za ponude
        </Link>
        <Link href="/dostavljac/aktivne" className="hover:underline">
          Aktivne isporuke
        </Link>
        <Link href="/dostavljac/cenovnik" className="hover:underline">
          Cenovnik i zone
        </Link>
      </nav>
      {children}
    </div>
  );
}
