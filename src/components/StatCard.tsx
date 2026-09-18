import type { ComponentType, SVGProps } from "react";

const ACCENT_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
};

/** Faza 13 (deo 2): KPI kartica za vrh portal dashboard-a, po Figma dizajnu. */
export function StatCard({
  icon: IconComp,
  value,
  label,
  accent = "slate",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: string | number;
  label: string;
  accent?: "emerald" | "blue" | "amber" | "slate";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ACCENT_CLASSES[accent]}`}
      >
        <IconComp className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight text-neutral-900">
          {value}
        </p>
        <p className="truncate text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}
