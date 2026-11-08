import { notFound } from "next/navigation";
import { isLocale } from "@repo/frontend/i18n/routing";
import { AuthGuard } from "@repo/frontend-features/layout/auth-guard";
import { DashboardLayout } from "@repo/frontend-features/layout/dashboard-layout";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AuthGuard locale={locale}>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
