"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

export function SubmitButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      }
      {...rest}
    >
      {pending ? "Sačuvavanje..." : children}
    </button>
  );
}
