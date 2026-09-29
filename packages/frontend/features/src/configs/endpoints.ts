const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set — add it to the app's .env.",
  );
}

/**
 * Every API URL the frontend knows, grouped by the API area that owns it.
 * This file owns the base URL: nothing else interpolates it, so callers always
 * hand the api-client an absolute URL.
 */
export const endpoints = {
  auth: {
    login: () => `${apiBaseUrl}/auth/login`,
    register: () => `${apiBaseUrl}/auth/register`,
  },
  users: {
    byId: (userId: string) => `${apiBaseUrl}/users/${userId}`,
  },
};
