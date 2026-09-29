import { ApiClient } from "./api-client";

export * from "./api-client";
export * from "./config";
export * from "./types";

export const api = new ApiClient({ guest: false });
export const apiGuest = new ApiClient({ guest: true });
