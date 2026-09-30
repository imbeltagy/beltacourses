import { redirect } from "next/navigation";
import { Cookies, getCookie } from "@repo/frontend/utils/cookies";
import { AuthLayout } from "@repo/frontend-features/layout/auth-layout";

/**
 * Guest-only. An already-signed-in moderator hitting /login is sent to the
 * panel rather than being shown a form that would only re-issue what they
 * already have.
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getCookie(Cookies.ACCESS_TOKEN)) redirect("/");

  return <AuthLayout>{children}</AuthLayout>;
}
