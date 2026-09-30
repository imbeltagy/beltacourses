"use server";

import { api } from "@repo/frontend/utils/api-client";
import { endpoints } from "../configs/endpoints";
import type { DataResult } from "../types/action";
import type {
  Group,
  ListGroupsQuery,
  ListGroupsResponse,
  PermissionCatalog,
} from "../types/api/groups";

export async function listGroupsAction(
  query: ListGroupsQuery = {},
): Promise<DataResult<ListGroupsResponse>> {
  const result = await api.get<ListGroupsResponse>(endpoints.groups.list(), {
    queries: { ...query },
    cache: "no-store",
  });

  if (!result.success) {
    return { success: false, message: "Couldn't load the groups list." };
  }

  return { success: true, message: result.message, data: result.data };
}

export async function getGroupAction(id: string): Promise<DataResult<Group>> {
  const result = await api.get<Group>(endpoints.groups.byId(id), {
    cache: "no-store",
  });

  if (!result.success) {
    return { success: false, message: "Couldn't load that group." };
  }

  return { success: true, message: result.message, data: result.data };
}

/**
 * The hardcoded catalog of every assignable permission, as
 * resource -> action -> permission string. Static for the life of a deploy,
 * so it is cached rather than re-fetched per render.
 */
export async function getPermissionCatalogAction(): Promise<
  DataResult<PermissionCatalog>
> {
  const result = await api.get<PermissionCatalog>(
    endpoints.groups.permissions(),
  );

  if (!result.success) {
    return { success: false, message: "Couldn't load the permission catalog." };
  }

  return { success: true, message: result.message, data: result.data };
}
