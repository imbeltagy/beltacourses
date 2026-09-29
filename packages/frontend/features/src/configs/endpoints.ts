import { apiBaseUrl } from "@repo/frontend/utils/api-client";

/**
 * Every API URL the frontend knows, grouped by the API area that owns it.
 * Functions rather than constants so the base URL is read per call — see
 * `apiBaseUrl`.
 */
export const endpoints = {
  auth: {
    login: () => `${apiBaseUrl()}/auth/login`,
    register: () => `${apiBaseUrl()}/auth/register`,
  },
  users: {
    byId: (userId: string) => `${apiBaseUrl()}/users/${userId}`,
  },
};
