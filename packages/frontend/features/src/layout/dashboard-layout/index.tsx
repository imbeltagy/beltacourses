import { cookies } from "next/headers";
import { getCurrentUserAction } from "../../actions/users-actions";
import { NAVBAR_TYPE_COOKIE, type NavbarType } from "./constants";
import { DashboardShell } from "./components/dashboard-shell";

export async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, store] = await Promise.all([getCurrentUserAction(), cookies()]);

  const saved = store.get(NAVBAR_TYPE_COOKIE)?.value;
  const navbarType: NavbarType = saved === "mini" ? "mini" : "full";

  return (
    <DashboardShell user={user} initialNavbarType={navbarType}>
      {children}
    </DashboardShell>
  );
}
