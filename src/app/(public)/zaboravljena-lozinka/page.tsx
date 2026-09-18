import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ZaboravljenaLozinkaPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Zaboravljena lozinka</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Unesite email sa kojim ste registrovani — kontaktiraćemo vas sa
          uputstvom za postavljanje nove lozinke.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
