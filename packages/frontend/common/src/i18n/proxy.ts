import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

/**
 * Redirects `/login` to `/<locale>/login` and keeps the `NEXT_LOCALE` cookie in
 * step. Apps re-export it as `src/proxy.ts` and declare their own `config`
 * matcher there — Next reads that statically, so it cannot be re-exported.
 */
export default createMiddleware(routing);
