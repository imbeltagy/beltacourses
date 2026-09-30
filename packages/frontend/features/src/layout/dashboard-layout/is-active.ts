/**
 * Ported from the previous admin project, with one deliberate change.
 *
 * The original matched the pathname *exactly*, which meant the Users item went
 * dark the moment you opened `/users/:id` — its `isParent` prefix branch
 * existed but was never passed `true`. Items now opt in via `matchNested`.
 *
 * Query handling is unchanged: the item's own params must all be present and
 * equal in the current URL, while extra params in the URL are ignored. So a
 * plain `/users` item stays active on `/users?page=3`.
 */
export function isActive(
  href: string,
  pathname: string,
  search: string,
  matchNested = false,
): boolean {
  const target = new URL(href, "http://local");
  const current = new URL(`${pathname}${search}`, "http://local");

  const samePath = matchNested
    ? current.pathname === target.pathname ||
      current.pathname.startsWith(`${target.pathname}/`)
    : current.pathname === target.pathname;

  if (!samePath) return false;

  for (const [key, value] of target.searchParams) {
    if (current.searchParams.get(key) !== value) return false;
  }

  return true;
}
