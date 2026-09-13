"use server";

import { apiGuest } from "@repo/frontend-libs/api-client";
import { setCookie, Cookies } from "@repo/frontend-libs/cookies";
import { endpoints } from "src/lib/endpoints";

type LoginPayload = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
};

export async function loginAction(data: { email: string; password: string }) {
  const result = await apiGuest.post<LoginPayload>(endpoints.login(), data);

  if (!result.success) {
    return { success: false as const, message: result.message };
  }

  await setCookie(
    Cookies.ACCESS_TOKEN,
    result.data.access_token,
    result.data.expires_in,
  );
  await setCookie(Cookies.REFRESH_TOKEN, result.data.refresh_token);

  return { success: true as const, message: result.message };
}
