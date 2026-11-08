/**
 * Wire shapes for `apps/api`'s `auth` controller. Hand-mirrored from its DTOs
 * (`apps/api/src/iam/dto/`) — snake_case is deliberate, it is what the API
 * sends.
 */

/** `POST /auth/register` only ever creates these two roles. */
export type RegisterableRole = "student" | "teacher";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  /** 8–72 characters, enforced by the API. */
  password: string;
  /** 2–100 characters, enforced by the API. */
  name: string;
  role: RegisterableRole;
};

/**
 * `POST /auth/login`. Shared with `POST /auth/moderators/login`, which returns
 * the identical schema; only the token lifetimes differ.
 */
export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  /** Access token lifetime in seconds. */
  expires_in: number;
  /** Refresh token lifetime in seconds. */
  refresh_expires_in: number;
};

/**
 * `POST /auth/refresh`. Refresh tokens rotate: the response carries the
 * replacement `refresh_token`, and the one just used no longer works.
 */
export type RefreshResponse = LoginResponse;

/**
 * What the app's own `/api/auth/*` route handlers return to the browser. The
 * refresh token never leaves the httpOnly cookie.
 */
export type SessionResponse = {
  access_token: string;
};
