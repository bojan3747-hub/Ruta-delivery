"use client";

import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // No meaningful "back" from the public landing page.
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
    >
      ← Nazad
    </button>
  );
}
