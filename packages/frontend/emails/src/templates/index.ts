import type { ComponentType } from "react";
import type { EmailProps } from "../i18n.ts";
import AccountCreated from "./account-created.tsx";
import LoginNotification from "./login-notification.tsx";
import ResetPassword from "./reset-password.tsx";
import VerifyEmail from "./verify-email.tsx";

/** The key is the file name under `dist/<locale>/` and the section in each locale file. */
export const templates = {
  "account-created": AccountCreated,
  "verify-email": VerifyEmail,
  "reset-password": ResetPassword,
  "login-notification": LoginNotification,
} satisfies Record<string, ComponentType<EmailProps & { logoUrl: string }>>;

export type TemplateName = keyof typeof templates;
