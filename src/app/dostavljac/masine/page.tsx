import { getCurrentUser } from "@/lib/auth";
import { getCourierMachines } from "@/lib/queries/machines";
import { MachineFleetForm } from "@/components/MachineFleetForm";

export default async function DostavljacMasinePage() {
  const user = await getCurrentUser();
  if (!user?.courierId) return null;

  const machines = await getCourierMachines(user.courierId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900">
          Angažovanje mašina
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Označite koje građevinske mašine posedujete i nudite — uvek SA
          rukovaocem (bez samostalnog najma). Klijenti koji opišu posao za
          neku od ovih mašina videće vaš zahtev, isto kao i za prevoz
          pošiljki.
        </p>
      </div>
      <MachineFleetForm defaults={machines} />
    </div>
  );
}
