import type { ReactNode, SVGProps } from "react";

/**
 * Faza 13 (deo 2): mali set linijskih ikonica za bočnu navigaciju i KPI
 * kartice u portalima (klijent/dostavljac/operater), po uzoru na Figma
 * dizajn. Namerno bez spoljne biblioteke ikonica (npr. lucide-react) — samo
 * par SVG putanja, da ne dodajemo novu zavisnost za desetak ikonica.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" />
    </Icon>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z" />
      <path d="M3 8.5 12 14l9-5.5" />
      <path d="M12 14v7" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7Z" />
    </Icon>
  );
}

export function ClipboardListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="4" width="12" height="17" rx="1.5" />
      <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" />
      <path d="M9 10h6M9 13.5h6M9 17h4" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="7" width="12" height="9" rx="1" />
      <path d="M14.5 10h3.3a1 1 0 0 1 .85.47l2.1 3.4a1 1 0 0 1 .15.53V16h-2" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </Icon>
  );
}

export function PercentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7" r="2.25" />
      <circle cx="17" cy="17" r="2.25" />
      <path d="M18 6 6 18" />
    </Icon>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
      <path d="M9 8h6M9 12h6" />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M15.7 13.5a4.5 4.5 0 0 1 5.3 4.5" />
    </Icon>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 12h5M9.5 15.5h5" />
    </Icon>
  );
}

export function KeyRoundIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 18 5" />
      <path d="M15.5 7.5 18 10M18 5l2.5 2.5" />
    </Icon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.4 2.4L16 10" />
    </Icon>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </Icon>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H8" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 5 14 14M19 5 5 19" />
    </Icon>
  );
}
