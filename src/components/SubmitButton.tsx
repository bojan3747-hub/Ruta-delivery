"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

export function SubmitButton({
  children,
  className,
  pendingLabel = "Obrada...",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      }
      {...rest}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
