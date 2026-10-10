"use server";

import { getTranslations } from "next-intl/server";
import { ApiClient } from "@repo/frontend/utils/api-client";
import { Cookies, deleteCookie, setCookie } from "@repo/frontend/utils/cookies";
import { endpoints } from "../configs/endpoints";
import type { ActionResult } from "../types/action";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/api/auth";

/**
 * The API returns both tokens in the JSON body (see the "Token transport" open
 * decision in `docs/roadmap.md`). Moving them into httpOnly cookies here is
 * what keeps them out of reach of client-side JS; it also means every
 * authenticated call has to go through a server action.
 */
async function storeSession(tokens: LoginResponse): Promise<void> {
  await setCookie(Cookies.ACCESS_TOKEN, tokens.access_token, tokens.expires_in);
  await setCookie(Cookies.REFRESH_TOKEN, tokens.refresh_token);
}

export async function loginAction(data: LoginRequest): Promise<ActionResult> {
  const result = await ApiClient.post<LoginResponse>(
    endpoints.auth.login(),
    data,
    { guest: true },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  await storeSession(result.data);

  // Not `result.message`: these endpoints return no `message` field, so the
  // api-client falls back to the literal string "success" — which is what the
  // user would otherwise read in the toast. Success copy belongs to the action.
  const t = await getTranslations("actions");
  return { success: true, message: t("welcomeBack") };
}

export async function registerAction(
  data: RegisterRequest,
): Promise<ActionResult> {
  // Multipart rather than JSON: the endpoint also accepts an optional avatar
  // file, so it is behind a file interceptor and will not parse a JSON body.
  const body = new FormData();
  body.set("email", data.email);
  body.set("password", data.password);
  body.set("name", data.name);
  body.set("role", data.role);

  const result = await ApiClient.post(endpoints.auth.register(), body, {
    guest: true,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  // Register returns the new user profile, not tokens — log in immediately
  // after so the caller lands authenticated either way.
  const session = await loginAction({
    email: data.email,
    password: data.password,
  });

  const t = await getTranslations("actions");

  if (!session.success) {
    // The account exists; only the follow-up login failed. Say so, rather than
    // letting "Invalid email or password" imply the registration was rejected.
    return {
      success: false,
      message: t("accountCreatedLoginFailed"),
    };
  }

  return { success: true, message: t("accountReady") };
}

/**
 * Staff sign-in for the admin panel. Same credentials shape and same response
 * as `loginAction`, but a different endpoint: `POST /auth/moderators/login`
 * rejects anyone who is not an `admin` or `super_admin`, and issues a much
 * shorter-lived access token (5 min vs 30) backed by a Redis session the API
 * can revoke.
 */
export async function loginModeratorAction(
  data: LoginRequest,
): Promise<ActionResult> {
  const result = await ApiClient.post<LoginResponse>(
    endpoints.auth.moderatorLogin(),
    data,
    { guest: true },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  await storeSession(result.data);

  const t = await getTranslations("actions");
  return { success: true, message: t("welcomeBack") };
}

/**
 * Revoke first, then clear: `POST /auth/logout` is behind `@Auth()`, so it
 * needs the access-token cookie that the next two lines remove.
 *
 * The result of the revoke is deliberately ignored. A moderator session that
 * the API refused to kill is a server-side problem; leaving the browser holding
 * cookies it believes are live would make it the user's problem too.
 */
export async function logoutAction(): Promise<ActionResult> {
  await ApiClient.post(endpoints.auth.logout(), {});

  await deleteCookie(Cookies.ACCESS_TOKEN);
  await deleteCookie(Cookies.REFRESH_TOKEN);

  const t = await getTranslations("actions");
  return { success: true, message: t("signedOut") };
}
