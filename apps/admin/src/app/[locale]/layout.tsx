import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fontVariables } from "@repo/frontend/fonts";
import { I18nProvider } from "@repo/frontend/components/i18n-provider";
import { getDirection, isLocale } from "@repo/frontend/i18n/routing";
import { AppTheme } from "@repo/frontend/theme/app-theme";
import "../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata.admin" });

  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale}>
          <AppTheme>{children}</AppTheme>
        </I18nProvider>
      </body>
    </html>
  );
}
