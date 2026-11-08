import {
  ClientErrorCode,
  parseErrorBody,
} from "@repo/frontend/utils/api-client";
import {
  Cookies,
  deleteCookie,
  getCookie,
  setCookie,
} from "@repo/frontend/utils/cookies";
import { endpoints } from "../../configs/endpoints";
import type { LoginResponse, SessionResponse } from "../../types/api/auth";
import { apiFetch, type ApiFetchResult } from "./api-fetch";

export const NO_STORE = { "Cache-Control": "no-store" };

/** Each cookie expires together with its token. */
export async function storeSession(tokens: LoginResponse): Promise<void> {
  await setCookie(Cookies.ACCESS_TOKEN, tokens.access_token, tokens.expires_in);
  await setCookie(
    Cookies.REFRESH_TOKEN,
    tokens.refresh_token,
    tokens.refresh_expires_in,
  );
}

/**
 * Best-effort API logout, then clears both cookies. A refresh-failure path has
 * no valid access token, so the API result is ignored.
 */
export async function endSession(): Promise<void> {
  const accessToken = await getCookie(Cookies.ACCESS_TOKEN);

  if (accessToken) {
    await apiFetch(endpoints.auth.logout(), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  await deleteCookie(Cookies.ACCESS_TOKEN);
  await deleteCookie(Cookies.REFRESH_TOKEN);
}

/** The browser-facing success body: the access token only. */
export function sessionResponse(tokens: LoginResponse): Response {
  const body: SessionResponse = { access_token: tokens.access_token };
  return Response.json(body, { headers: NO_STORE });
}

/**
 * Turns a failed `apiFetch` into the error `Response`. A body that honours the
 * `{ code, error, message? }` contract is forwarded with its status; anything
 * else is a contract violation, and no response at all is a network failure.
 */
export function errorResponse(result: ApiFetchResult): Response {
  if (result.status === 0) {
    return Response.json(
      { code: 502, error: ClientErrorCode.NETWORK_ERROR },
      { status: 502, headers: NO_STORE },
    );
  }

  const body = parseErrorBody(result.payload);

  if (!body) {
    return Response.json(
      { code: 502, error: ClientErrorCode.INVALID_ERROR_RESPONSE },
      { status: 502, headers: NO_STORE },
    );
  }

  return Response.json(body, { status: result.status, headers: NO_STORE });
}

export function isSuccess(result: ApiFetchResult): boolean {
  return result.status >= 200 && result.status < 300;
}
