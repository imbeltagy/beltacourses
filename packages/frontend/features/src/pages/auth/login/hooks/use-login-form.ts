"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import * as yup from "yup";
import { toast } from "sonner";
import { localizeError } from "../../../../utils/localize-error";
import { loginAction } from "../../../../actions/auth-actions";

type T = ReturnType<typeof useTranslations<"validation">>;

const buildSchema = (t: T) =>
  yup.object().shape({
    email: yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    password: yup.string().required(t("passwordRequired")),
  });

export type LoginFormInputs = yup.InferType<ReturnType<typeof buildSchema>>;

/**
 * Owns the schema, the form instance and the submit handler, so
 * `components/login-form.tsx` stays pure markup and does not change when the
 * API call behind the submit does.
 */
export function useLoginForm() {
  const t = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const form = useForm<LoginFormInputs>({
    resolver: yupResolver(buildSchema(t)),
  });

  const submit: SubmitHandler<LoginFormInputs> = async (data) => {
    const result = await loginAction(data);

    if (!result.success) {
      toast.error(localizeError(tErrors, result.error, "login"));
      return;
    }

    toast.success(tActions("welcomeBack"));
  };

  return { form, onSubmit: form.handleSubmit(submit) };
}
