"use client";

import { useEffect, useRef, useState, type DependencyList } from "react";
import type { DataResult } from "../types/action";

/**
 * Runs a `DataResult` action in the browser. `ApiClient` is browser-only (the
 * token lives in a client store), so a server component cannot fetch with it.
 * List state lives in the URL, so the server page parses `searchParams` and
 * passes the values down; the client component hands them to this hook as
 * `deps`.
 *
 * Fetches on mount and whenever `deps` change; a response that arrives after
 * the deps changed again is dropped. Previous `data` stays while a new request
 * is in flight, so `refetch()` and param changes do not blank the page —
 * render a skeleton only for `loading && !data`. Pass `enabled: false` to skip
 * the request (nothing is fetched and `loading` stays `false`).
 */
export function useApi<T>(
  fetcher: () => Promise<DataResult<T>>,
  deps: DependencyList,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(enabled);
  const [version, setVersion] = useState(0);
  // Always call the latest closure without making it an effect dependency.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let stale = false;
    setLoading(true);
    setError(undefined);

    fetcherRef.current().then((result) => {
      if (stale) return;

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });

    return () => {
      stale = true;
    };
    // `deps` is the caller's list; `version` re-runs it for `refetch`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps]);

  return {
    data,
    error,
    loading,
    refetch: () => setVersion((v) => v + 1),
  };
}
