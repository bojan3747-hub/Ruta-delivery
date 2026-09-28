import { getCurrentUser } from "@/lib/auth";
import { MachineRequestForm } from "@/components/MachineRequestForm";

export default async function NovoAngazovanjeMasinePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">
          Novo angažovanje mašine
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Mašina se uvek angažuje sa rukovaocem. Nema fiksnog cenovnika —
          izvođači koji pokrivaju vašu zonu i nude izabranu mašinu, na osnovu
          opisa posla šalju ponudu sa cenom i procenom trajanja.
        </p>
      </div>
      <MachineRequestForm
        defaultContactName={user?.ime ?? ""}
        defaultContactPhone={user?.telefon ?? ""}
      />
    </div>
  );
}
