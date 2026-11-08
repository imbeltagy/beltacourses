import { notFound } from "next/navigation";
import { isLocale } from "@repo/frontend/i18n/routing";
import { AuthGuard } from "@repo/frontend-features/layout/auth-guard";

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <AuthGuard locale={locale}>{children}</AuthGuard>;
}
