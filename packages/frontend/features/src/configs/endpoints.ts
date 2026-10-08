import { ApiClient } from "@repo/frontend/utils/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set — add it to the app's .env.",
  );
}

// Every action imports this file, so the client is configured before its first
// request. It is the only place the refresh URL is built.
ApiClient.configure({ refreshUrl: `${apiBaseUrl}/auth/refresh` });

/**
 * Every API URL the frontend knows, grouped by the API area that owns it.
 * This file owns the base URL: nothing else interpolates it, so callers always
 * hand the api-client an absolute URL.
 */
export const endpoints = {
  auth: {
    login: () => `${apiBaseUrl}/auth/login`,
    /** Staff sign-in. Rejects anyone who is not an admin or super_admin. */
    moderatorLogin: () => `${apiBaseUrl}/auth/moderators/login`,
    register: () => `${apiBaseUrl}/auth/register`,
    logout: () => `${apiBaseUrl}/auth/logout`,
  },
  users: {
    list: () => `${apiBaseUrl}/users`,
    me: () => `${apiBaseUrl}/users/me`,
    byId: (userId: string) => `${apiBaseUrl}/users/${userId}`,
  },
  groups: {
    list: () => `${apiBaseUrl}/groups`,
    /** Must stay above `byId` in any route-order-sensitive reasoning. */
    permissions: () => `${apiBaseUrl}/groups/permissions`,
    byId: (groupId: string) => `${apiBaseUrl}/groups/${groupId}`,
    user: (groupId: string, userId: string) =>
      `${apiBaseUrl}/groups/${groupId}/users/${userId}`,
  },
};
