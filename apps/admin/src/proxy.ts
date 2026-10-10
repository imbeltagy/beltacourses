export { default } from "@repo/frontend/i18n/proxy";

// Everything except API/internal routes and files with an extension (assets).
export const config = { matcher: "/((?!api|_next|_vercel|.*\\..*).*)" };
