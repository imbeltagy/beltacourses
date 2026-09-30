"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * List state (page, search, filters) lives in the URL rather than component
 * state, so the pages stay server components that read `searchParams` and
 * fetch. It also makes a filtered list shareable and survivable across a
 * refresh.
 *
 * `pending` is the transition flag — use it to dim the table while the server
 * re-renders instead of swapping in a spinner.
 */
export function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setQuery = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // Any filter change invalidates the current page — page 4 of an
      // unfiltered list is rarely a valid page of the filtered one.
      if (!("page" in updates)) params.delete("page");

      const query = params.toString();

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  return { searchParams, setQuery, pending };
}
