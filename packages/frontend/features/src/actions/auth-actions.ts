import { ApiClient } from "@repo/frontend/utils/api-client";
import { useAuthStore } from "@repo/frontend/utils/auth-store";
import { endpoints } from "../configs/endpoints";
import type { ActionResult } from "../types/action";
import type {
  LoginRequest,
  RegisterRequest,
  SessionResponse,
} from "../types/api/auth";

export async function loginAction(data: LoginRequest): Promise<ActionResult> {
  const result = await ApiClient.post<SessionResponse>(
    endpoints.session.login,
    data,
    { guest: true },
  );

  if (!result.success) return { success: false, error: result.error };

  useAuthStore.getState().setAccessToken(result.data.access_token);

  return { success: true };
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

  if (!result.success) return { success: false, error: result.error };

  // Register returns the new user profile, not tokens — log in immediately
  // after so the caller lands authenticated either way.
  const session = await loginAction({
    email: data.email,
    password: data.password,
  });

  if (!session.success) {
    // The account exists; only the follow-up login failed. Say so, rather than
    // letting INVALID_CREDENTIALS imply the registration was rejected.
    return { success: false, error: "ACCOUNT_CREATED_LOGIN_FAILED" };
  }

  return { success: true };
}

/**
 * Staff sign-in for the admin panel. Same credentials shape and same response
 * as `loginAction`, but a different route handler: it calls
 * `POST /auth/moderators/login`, which rejects anyone who is not an `admin` or
 * `super_admin`, and issues a much shorter-lived access token (5 min vs 30)
 * backed by a Redis session the API can revoke. The route handler sets the
 * httpOnly cookies; only the access token reaches the browser.
 */
export async function loginModeratorAction(
  data: LoginRequest,
): Promise<ActionResult> {
  const result = await ApiClient.post<SessionResponse>(
    endpoints.session.moderatorLogin,
    data,
    { guest: true },
  );

  if (!result.success) return { success: false, error: result.error };

  useAuthStore.getState().setAccessToken(result.data.access_token);

  return { success: true };
}

/**
 * The logout route handler revokes the session on the API first, then clears
 * the cookies. `ApiClient.logout` also drops the in-memory token and reloads
 * the page, so the guard layout sees no session and redirects to `/login`.
 */
export async function logoutAction(): Promise<ActionResult> {
  await ApiClient.logout();

  return { success: true };
}
