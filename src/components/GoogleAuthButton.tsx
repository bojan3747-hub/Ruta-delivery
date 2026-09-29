import Link from "next/link";

// Faza 20: isti link za prijavu i registraciju (/auth/google odlučuje
// find-or-create logikom na callback-u) — namerno bez Google logotipa (samo
// tekst), da izbegnemo pitanja oko pravila korišćenja brenda za slučajno
// netačno korišćen logotip.
export function GoogleAuthButton() {
  return (
    <Link
      href="/auth/google"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
    >
      Nastavi sa Google nalogom
    </Link>
  );
}
