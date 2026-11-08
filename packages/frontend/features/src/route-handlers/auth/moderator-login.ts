import { endpoints } from "../../configs/endpoints";
import type { LoginRequest, LoginResponse } from "../../types/api/auth";
import { apiFetch } from "../shared/api-fetch";
import {
  errorResponse,
  isSuccess,
  sessionResponse,
  storeSession,
} from "../shared/session";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as LoginRequest;

  const result = await apiFetch(endpoints.auth.moderatorLogin(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!isSuccess(result)) return errorResponse(result);

  const tokens = result.payload as LoginResponse;
  await storeSession(tokens);
  return sessionResponse(tokens);
}
