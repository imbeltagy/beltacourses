"use client";

import { getCurrentUserAction } from "../actions/users-actions";
import type { User } from "../types/api/users";
import { useApi } from "./use-api";

/**
 * The signed-in user, fetched in the browser. The dashboard shell owns the
 * fetch and passes `user` down; other client components may call this hook,
 * but each call makes its own request, so prefer passing props. `user` is
 * `null` while loading and when the request fails.
 */
export function useCurrentUser() {
  const { data, loading, error, refetch } = useApi(getCurrentUserAction, []);

  return { user: (data ?? null) as User | null, loading, error, refetch };
}
