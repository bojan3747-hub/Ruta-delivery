"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions/auth-actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage error={state.error} />
      <div>
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input
          type="email"
          name="email"
          required
          placeholder="ime@firma.rs"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Lozinka</label>
        <input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>
      <SubmitButton
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        pendingLabel="Prijavljivanje..."
      >
        Prijavi se
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/zaboravljena-lozinka" className="text-emerald-600 hover:underline">
          Zaboravili ste lozinku?
        </Link>
      </p>
    </form>
  );
}
