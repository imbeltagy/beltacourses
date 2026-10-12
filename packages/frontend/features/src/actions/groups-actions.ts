"use server";

import { ApiClient } from "@repo/frontend/utils/api-client";
import { endpoints } from "../configs/endpoints";
import type { ActionResult, DataResult } from "../types/action";
import type {
  CreateGroupInput,
  Group,
  ListGroupsQuery,
  ListGroupsResponse,
  PermissionCatalog,
  UpdateGroupInput,
} from "../types/api/groups";
import type { User } from "../types/api/users";

export async function listGroupsAction(
  query: ListGroupsQuery = {},
): Promise<DataResult<ListGroupsResponse>> {
  const result = await ApiClient.get<ListGroupsResponse>(
    endpoints.groups.list(),
    {
      queries: { ...query },
      cache: "no-store",
    },
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function getGroupAction(id: string): Promise<DataResult<Group>> {
  const result = await ApiClient.get<Group>(endpoints.groups.byId(id), {
    cache: "no-store",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

/**
 * The hardcoded catalog of every assignable permission, as
 * resource -> action -> permission string. Static for the life of a deploy,
 * so it is cached rather than re-fetched per render.
 */
export async function getPermissionCatalogAction(): Promise<
  DataResult<PermissionCatalog>
> {
  const result = await ApiClient.get<PermissionCatalog>(
    endpoints.groups.permissions(),
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function createGroupAction(
  input: CreateGroupInput,
): Promise<DataResult<Group>> {
  const result = await ApiClient.post<Group>(endpoints.groups.list(), input);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function updateGroupAction(
  id: string,
  input: UpdateGroupInput,
): Promise<DataResult<Group>> {
  const result = await ApiClient.patch<Group>(endpoints.groups.byId(id), input);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function deleteGroupAction(id: string): Promise<ActionResult> {
  const result = await ApiClient.delete(endpoints.groups.byId(id));

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

/** Admins only; the API also ends the user's live sessions so permissions refresh. */
export async function assignUserToGroupAction(
  groupId: string,
  userId: string,
): Promise<DataResult<User>> {
  const result = await ApiClient.put<User>(
    endpoints.groups.user(groupId, userId),
    {},
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}

export async function unassignUserFromGroupAction(
  groupId: string,
  userId: string,
): Promise<ActionResult> {
  const result = await ApiClient.delete(endpoints.groups.user(groupId, userId));

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
