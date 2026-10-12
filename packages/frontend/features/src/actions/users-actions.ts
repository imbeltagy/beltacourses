"use server";

import { ApiClient } from "@repo/frontend/utils/api-client";
import { endpoints } from "../configs/endpoints";
import type { ActionResult, DataResult } from "../types/action";
import type {
  CreateUserInput,
  ListUsersQuery,
  ListUsersResponse,
  UpdateUserInput,
  User,
} from "../types/api/users";
import { toFormData } from "../utils/to-form-data";

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

export async function createUserAction(
  input: CreateUserInput,
  /** Language of the "your account exists" email the API sends. */
  locale?: string,
): Promise<DataResult<User>> {
  // Multipart, not JSON: the endpoint sits behind a file interceptor for the
  // optional avatar and will not parse a JSON body.
  const result = await ApiClient.post<User>(
    endpoints.users.list(),
    toFormData({ ...input }),
    locale ? { headers: { "Accept-Language": locale } } : undefined,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function updateUserAction(
  id: string,
  input: UpdateUserInput,
): Promise<DataResult<User>> {
  const result = await ApiClient.patch<User>(
    endpoints.users.byId(id),
    toFormData({ ...input }),
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const result = await ApiClient.delete(endpoints.users.byId(id));

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
