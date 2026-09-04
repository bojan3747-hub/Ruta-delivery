"use client";

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
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          name="email"
          required
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Lozinka</label>
        <input
          type="password"
          name="password"
          required
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      <SubmitButton className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
        Prijavi se
      </SubmitButton>
    </form>
  );
}
