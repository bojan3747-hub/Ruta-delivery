import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function OperaterLayout({
  children,
}: LayoutProps<"/operater">) {
  await requireUser("OPERATOR");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 border-b border-black/10 pb-3 text-sm">
        <Link href="/operater" className="font-medium hover:underline">
          Pregled
        </Link>
        <Link href="/operater/dostavljaci" className="hover:underline">
          Dostavljači
        </Link>
        <Link href="/operater/provizija" className="hover:underline">
          Provizija
        </Link>
      </nav>
      {children}
    </div>
  );
}
