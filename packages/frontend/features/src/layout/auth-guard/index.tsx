import type { ReactNode } from "react";
import { redirect } from "@repo/frontend/i18n/navigation";
import type { Locale } from "@repo/frontend/i18n/routing";
import { Cookies, getCookie } from "@repo/frontend/utils/cookies";

/**
 * A cookie check only — it proves a session was issued, not that it is still
 * valid or that the holder is allowed in. The API is the real authority: every
 * request is authorized there, and a revoked token fails those calls
 * regardless of what this sees. An expired access cookie with a live refresh
 * cookie passes; the client api-client then refreshes.
 */
export async function AuthGuard({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const hasSession =
    (await getCookie(Cookies.ACCESS_TOKEN)) ||
    (await getCookie(Cookies.REFRESH_TOKEN));

  if (!hasSession) {
    redirect({ href: "/login", locale });
  }

  return children;
}
