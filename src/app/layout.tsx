import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { BackButton } from "@/components/BackButton";
import { NavigationDepthTracker } from "@/components/NavigationDepthTracker";

export const metadata: Metadata = {
  title: "Ruta-Dostava — dostava u Beogradu",
  description:
    "Ruta-Dostava je B2B platforma koja povezuje firme sa kombi prevoznicima i kurirskim službama u Beogradu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <NavigationDepthTracker />
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <BackButton />
          {children}
        </main>
        <footer className="border-t border-black/10 py-4 text-center text-xs text-black/40">
          <p>Ruta-Dostava — MVP prototip, Beograd</p>
          <p className="mt-1">
            <Link
              href="/dokumenti/politika-privatnosti.pdf"
              className="underline hover:text-black/60"
            >
              Politika privatnosti
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
