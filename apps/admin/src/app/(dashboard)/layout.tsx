import { redirect } from "next/navigation";
import { Cookies, getCookie } from "@repo/frontend/utils/cookies";
import { DashboardLayout } from "@repo/frontend-features/layout/dashboard-layout";

/**
 * A cookie check only — it proves a session was issued, not that it is still
 * valid or that the holder is staff. The API is the real authority: every
 * request from the panel is authorized there, and a revoked or client-role
 * token fails those calls regardless of what this sees.
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getCookie(Cookies.ACCESS_TOKEN))) redirect("/login");

  return <DashboardLayout>{children}</DashboardLayout>;
}
