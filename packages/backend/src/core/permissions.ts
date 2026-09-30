/**
 * Pure functions only — no Nest, no DB. Wildcard matching is per-segment, the
 * Apache Shiro convention.
 */

/** One granted string vs one required string. */
export function matchesPermission(granted: string, required: string): boolean {
  if (granted === '*') return true;

  const grantedSegments = granted.split(':');
  const requiredSegments = required.split(':');
  if (grantedSegments.length !== requiredSegments.length) return false;

  return grantedSegments.every(
    (segment, i) => segment === '*' || segment === requiredSegments[i],
  );
}

/** Every required string must be matched by at least one granted string. */
export function hasAllPermissions(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.every((requiredPermission) =>
    granted.some((grantedPermission) =>
      matchesPermission(grantedPermission, requiredPermission),
    ),
  );
}
