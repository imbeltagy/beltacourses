import { PERMISSION_GROUPS } from '@repo/service/core';

/**
 * Documents the shape of `PERMISSION_GROUPS` — a nested object of
 * resource -> action -> permission string. This is the hardcoded catalog of
 * every assignable permission; a UI renders one section per resource.
 *
 * A decorator cannot be attached to a TS index signature, so this stays a
 * plain type and the controller documents it with an inline
 * `@ApiOkResponse({ schema })` instead of `type: PermissionCatalogResponse`.
 */
export type PermissionCatalogResponse = typeof PERMISSION_GROUPS;

export const PERMISSION_CATALOG_SCHEMA = {
  type: 'object' as const,
  additionalProperties: {
    type: 'object' as const,
    additionalProperties: { type: 'string' as const },
  },
  example: PERMISSION_GROUPS,
  description: 'The hardcoded catalog of every assignable permission.',
};
