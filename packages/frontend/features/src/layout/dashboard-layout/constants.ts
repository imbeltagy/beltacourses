/**
 * Geometry ported from the previous admin project's `config/theme/layout.ts`.
 * The numbers are load-bearing: the header is narrowed by exactly the rail
 * width, and the content is offset by both.
 */
export const HEADER_HEIGHT = 64;

export const NAVBAR_WIDTH = {
  full: 250,
  mini: 60,
} as const;

export type NavbarType = keyof typeof NAVBAR_WIDTH;

/**
 * The desktop breakpoint. 900px because that is MUI's `md`, which is what the
 * original layout was built against — Tailwind's `md` is 768px, so every
 * shell-level media query here is a `min-[900px]:` arbitrary variant rather
 * than a named one. Changing this changes where the rail appears.
 */
export const DESKTOP_BREAKPOINT = 900;

/**
 * Collapsed/expanded is stored in a cookie rather than localStorage so the
 * server renders the correct rail width on the first paint. The original read
 * localStorage in an effect and visibly snapped from full to mini on load.
 */
export const NAVBAR_TYPE_COOKIE = "beltacourses-navbar-type";
