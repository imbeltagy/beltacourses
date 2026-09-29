/**
 * Resolved per call, never at import time: a module that throws while being
 * imported takes down every consumer that merely references it, including
 * pages that make no API call at all.
 *
 * `process.env.NEXT_PUBLIC_API_URL` is inlined by Next at build time, so this
 * stays a compile-time constant lookup despite being wrapped in a function.
 */
export function apiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set — add it to the app's .env before making API calls.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
}
