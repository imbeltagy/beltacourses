import { create } from "zustand";

type AuthState = {
  accessToken: string | undefined;
  setAccessToken: (token: string | undefined) => void;
};

/**
 * The access token lives in memory only; a page reload re-hydrates it from the
 * httpOnly cookie. Non-React code (`ApiClient`) reads it with
 * `useAuthStore.getState()`.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: undefined,
  setAccessToken: (token) => set({ accessToken: token }),
}));
