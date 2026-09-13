"use server";

import { apiGuest } from "@repo/frontend-libs/api-client";
import { endpoints } from "src/lib/endpoints";
import { loginAction } from "../login/actions";

export type RegisterInputs = {
  email: string;
  password: string;
  name: string;
  role: "student" | "teacher";
};

export async function registerAction(data: RegisterInputs) {
  const formData = new FormData();
  formData.set("email", data.email);
  formData.set("password", data.password);
  formData.set("name", data.name);
  formData.set("role", data.role);

  const result = await apiGuest.post(endpoints.register(), formData);

  if (!result.success) {
    return { success: false as const, message: result.message };
  }

  // Register only returns the user profile — log in right after to get the
  // access/refresh cookies, same as a normal login.
  return loginAction({ email: data.email, password: data.password });
}
