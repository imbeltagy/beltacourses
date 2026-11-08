import { cookies } from "next/headers";
import { NAVBAR_TYPE_COOKIE, type NavbarType } from "./constants";
import { DashboardShell } from "./components/dashboard-shell";

export async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();

  const saved = store.get(NAVBAR_TYPE_COOKIE)?.value;
  const navbarType: NavbarType = saved === "mini" ? "mini" : "full";

  return (
    <DashboardShell initialNavbarType={navbarType}>{children}</DashboardShell>
  );
}
