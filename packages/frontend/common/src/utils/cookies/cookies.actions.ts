"use server";

import { cookies } from "next/headers";
import { Cookies } from "./cookies.constants";

export async function getCookie(name: Cookies): Promise<string | undefined> {
  const store = await cookies();
  return store.get(name)?.value;
}

/** Each cookie expires together with its token, so `maxAge` is required. */
export async function setCookie(
  name: Cookies,
  value: string,
  maxAge: number,
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
