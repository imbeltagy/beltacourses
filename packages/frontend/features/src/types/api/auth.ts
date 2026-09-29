/**
 * Wire shapes for `apps/api`'s `auth` controller. Hand-mirrored from its DTOs
 * (`apps/api/src/auth/dto/`) — snake_case is deliberate, it is what the API
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
};

/** `POST /auth/refresh`. No `refresh_token` — the API does not rotate them. */
export type RefreshResponse = Omit<LoginResponse, "refresh_token">;
