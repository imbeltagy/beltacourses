"use server";

import { cookies } from "next/headers";
import { Cookies } from "./cookies.constants";

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export async function getCookie(name: Cookies): Promise<string | undefined> {
  const store = await cookies();
  return store.get(name)?.value;
}

export async function setCookie(
  name: Cookies,
  value: string,
  maxAge: number = SEVEN_DAYS_IN_SECONDS,
): Promise<void> {
  const store = await cookies();
  store.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function deleteCookie(name: Cookies): Promise<void> {
  const store = await cookies();
  store.delete(name);
}
