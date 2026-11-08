import type { ReactNode } from "react";
import { Cookies, getCookie } from "@repo/frontend/utils/cookies";
import { AuthStoreHydrator } from "./components/auth-store-hydrator";

/**
 * Forwards the access cookie into the in-memory auth store, nothing more. It
 * neither guards nor redirects; the token may be undefined when only the
 * refresh cookie remains, and the api-client then refreshes on first request.
 */
export async function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = await getCookie(Cookies.ACCESS_TOKEN);

  return (
    <AuthStoreHydrator accessToken={accessToken}>{children}</AuthStoreHydrator>
  );
}
