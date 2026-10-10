"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "../../ui/button";
import { usePathname, useRouter } from "../../i18n/navigation";
import { routing, type Locale } from "../../i18n/routing";

/**
 * One button that flips to the other locale. With exactly two locales a menu
 * would be a click more for nothing — swap it for a dropdown if a third lands.
 * Each language is named in its own script, so it is findable from the wrong one.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, startTransition] = useTransition();

  const target: Locale =
    routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  function switchLocale() {
    startTransition(() => {
      // Keep the query so a filtered list survives the switch.
      router.replace(search ? `${pathname}?${search}` : pathname, {
        locale: target,
        scroll: false,
      });
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      disabled={pending}
      onClick={switchLocale}
      aria-label={t("switchTo", { language: t(`names.${target}`) })}
      lang={target}
    >
      <Languages aria-hidden="true" />
      {t(`names.${target}`)}
    </Button>
  );
}
