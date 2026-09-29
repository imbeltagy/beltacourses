"use server";

import { apiGuest } from "@repo/frontend/utils/api-client";
import { Cookies, setCookie } from "@repo/frontend/utils/cookies";
import { endpoints } from "../configs/endpoints";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/api/auth";

/**
 * What every action in this file resolves to. Actions never throw and never
 * leak a status code to the UI — a page's hook branches on `success` and shows
 * `message`.
 */
export type ActionResult = {
  success: boolean;
  message: string;
};

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
  const result = await apiGuest.post<LoginResponse>(
    endpoints.auth.login(),
    data,
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  await storeSession(result.data);

  // Not `result.message`: these endpoints return no `message` field, so the
  // api-client falls back to the literal string "success" — which is what the
  // user would otherwise read in the toast. Success copy belongs to the action.
  return { success: true, message: "Welcome back!" };
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

  const result = await apiGuest.post(endpoints.auth.register(), body);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  // Register returns the new user profile, not tokens — log in immediately
  // after so the caller lands authenticated either way.
  const session = await loginAction({
    email: data.email,
    password: data.password,
  });

  if (!session.success) {
    // The account exists; only the follow-up login failed. Say so, rather than
    // letting "Invalid email or password" imply the registration was rejected.
    return {
      success: false,
      message: "Account created, but signing you in failed. Please log in.",
    };
  }

  return { success: true, message: "Your account is ready." };
}
