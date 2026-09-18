import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Klijent",
  COURIER: "Dostavljač",
  OPERATOR: "Operater",
};

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
            R
          </span>
          <span className="font-serif font-semibold text-neutral-900">
            Ruta-Dostava
          </span>
        </Link>
        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-black/60">
              {user.ime} · {ROLE_LABELS[user.role]}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-black/15 px-3 py-1.5 hover:bg-black/5"
              >
                Odjava
              </button>
            </form>
          </div>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/prijava" className="hover:underline">
              Prijava
            </Link>
            <Link
              href="/registracija"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
            >
              Registracija
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
