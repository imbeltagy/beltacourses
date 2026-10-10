"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import * as yup from "yup";
import { toast } from "sonner";
import { localizeError } from "../../../../utils/localize-error";
import { registerAction } from "../../../../actions/auth-actions";
import type { RegisterableRole } from "../../../../types/api/auth";

// Mirrors the API's RegisterDto constraints so a bad field is caught before
// the round trip; the API still validates on its own side.
const NAME = { min: 2, max: 100 };
const PASSWORD = { min: 8, max: 72 };

type T = ReturnType<typeof useTranslations<"validation">>;

const buildSchema = (t: T) =>
  yup.object().shape({
    name: yup
      .string()
      .min(NAME.min, t("nameMin", NAME))
      .max(NAME.max, t("nameMax", NAME))
      .required(t("nameRequired")),
    email: yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    password: yup
      .string()
      .min(PASSWORD.min, t("passwordMin", PASSWORD))
      .max(PASSWORD.max, t("passwordMax", PASSWORD))
      .required(t("passwordRequired")),
    role: yup.string<RegisterableRole>().required(t("roleRequired")),
    bio: yup.string().default(""),
  });

export type RegisterFormInputs = yup.InferType<ReturnType<typeof buildSchema>>;

const REGISTERABLE_ROLES = [
  "student",
  "teacher",
] as const satisfies readonly RegisterableRole[];

export function useRegisterForm() {
  const tValidation = useTranslations("validation");
  const tRoles = useTranslations("roles");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const form = useForm<RegisterFormInputs>({
    resolver: yupResolver(buildSchema(tValidation)),
    defaultValues: { role: "student" },
  });

  // `bio` is collected but not sent: POST /auth/register has no field for it
  // yet. It stays in the form so the teacher flow is already shaped for it.
  const submit: SubmitHandler<RegisterFormInputs> = async (data) => {
    const result = await registerAction({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
    });

    if (!result.success) {
      toast.error(localizeError(tErrors, result.error, "register"));
      return;
    }

    toast.success(tActions("accountReady"));
  };

  return {
    form,
    onSubmit: form.handleSubmit(submit),
    // Watched rather than mirrored into `useState`: the radio group is the
    // single source of truth, so the bio field cannot drift out of sync.
    isTeacher: form.watch("role") === "teacher",
    roleOptions: REGISTERABLE_ROLES.map((value) => ({
      value,
      label: tRoles(value),
    })),
  };
}
