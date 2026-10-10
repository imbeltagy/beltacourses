import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";
import "./types";

/**
 * Locale-aware drop-ins for `next/link` and `next/navigation`. Paths passed to
 * and returned from these never carry the locale prefix — `usePathname()` on
 * `/ar/users` is `/users` — so route matching and nav highlighting stay
 * locale-free. `useSearchParams` has no equivalent and stays in `next/navigation`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
