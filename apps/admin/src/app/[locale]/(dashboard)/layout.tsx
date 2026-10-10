import { notFound } from "next/navigation";
import { redirect } from "@repo/frontend/i18n/navigation";
import { isLocale } from "@repo/frontend/i18n/routing";
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
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  if (!(await getCookie(Cookies.ACCESS_TOKEN))) {
    redirect({ href: "/login", locale });
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
