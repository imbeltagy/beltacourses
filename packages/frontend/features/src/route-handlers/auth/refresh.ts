import { ClientErrorCode } from "@repo/frontend/utils/api-client";
import { Cookies, getCookie } from "@repo/frontend/utils/cookies";
import { endpoints } from "../../configs/endpoints";
import type { RefreshResponse } from "../../types/api/auth";
import { apiFetch } from "../shared/api-fetch";
import {
  NO_STORE,
  endSession,
  errorResponse,
  isSuccess,
  sessionResponse,
  storeSession,
} from "../shared/session";

export async function POST(): Promise<Response> {
  const refreshToken = await getCookie(Cookies.REFRESH_TOKEN);

  if (!refreshToken) {
    await endSession();
    return Response.json(
      { code: 401, error: ClientErrorCode.NO_REFRESH_TOKEN },
      { status: 401, headers: NO_STORE },
    );
  }

  const result = await apiFetch(endpoints.auth.refresh(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!isSuccess(result)) {
    await endSession();
    return errorResponse(result);
  }

  const tokens = result.payload as RefreshResponse;
  await storeSession(tokens);
  return sessionResponse(tokens);
}
