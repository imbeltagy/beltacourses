"use server";

import { ApiClient } from "@repo/frontend/utils/api-client";
import { endpoints } from "../configs/endpoints";
import type { DataResult } from "../types/action";
import type {
  ListUsersQuery,
  ListUsersResponse,
  User,
} from "../types/api/users";

/** The signed-in moderator. `null` rather than an error when unauthenticated. */
export async function getCurrentUserAction(): Promise<User | null> {
  const result = await ApiClient.get<User>(endpoints.users.me());

  return result.success ? result.data : null;
}

export async function listUsersAction(
  query: ListUsersQuery = {},
): Promise<DataResult<ListUsersResponse>> {
  const result = await ApiClient.get<ListUsersResponse>(
    endpoints.users.list(),
    {
      queries: { ...query },
      // Always fresh: this list is the reason the page was opened, and a stale
      // page after a delete is worse than a round trip.
      cache: "no-store",
    },
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function getUserAction(id: string): Promise<DataResult<User>> {
  const result = await ApiClient.get<User>(endpoints.users.byId(id), {
    cache: "no-store",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}
