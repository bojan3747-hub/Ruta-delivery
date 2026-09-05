import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth-actions";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Klijent",
  COURIER: "Dostavljač",
  OPERATOR: "Operater",
};

const ROLE_HOME: Record<string, string> = {
  CLIENT: "/klijent",
  COURIER: "/dostavljac",
  OPERATOR: "/operater",
};

export async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href={user ? ROLE_HOME[user.role] : "/"}
          className="flex items-center gap-2 text-lg tracking-tight"
        >
          <svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="6" stroke="#047857" strokeWidth="3.5" />
            <path
              d="M16 22 V32 Q16 38 22 38 H40 Q46 38 46 44 V48"
              stroke="#047857"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="46" cy="50" r="6" fill="#1e3a5f" />
          </svg>
          <span>
            <span className="font-bold text-emerald-800">Ruta</span>
            <span className="font-medium text-neutral-900">-Dostava</span>
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
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-800"
            >
              Registracija
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
