import { requireUser } from "@/lib/auth";

export default async function KlijentLayout({
  children,
}: LayoutProps<"/klijent">) {
  await requireUser("CLIENT");
  return <>{children}</>;
}
