"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import * as yup from "yup";
import { toast } from "sonner";
import { useRouter } from "@repo/frontend/i18n/navigation";
import { localizeError } from "../../../../utils/localize-error";
import { loginModeratorAction } from "../../../../actions/auth-actions";

type T = ReturnType<typeof useTranslations<"validation">>;

const buildSchema = (t: T) =>
  yup.object().shape({
    email: yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    password: yup.string().required(t("passwordRequired")),
  });

export type ModeratorLoginInputs = yup.InferType<
  ReturnType<typeof buildSchema>
>;

export function useModeratorLoginForm() {
  const router = useRouter();
  const t = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const form = useForm<ModeratorLoginInputs>({
    resolver: yupResolver(buildSchema(t)),
  });

  const submit: SubmitHandler<ModeratorLoginInputs> = async (data) => {
    const result = await loginModeratorAction(data);

    if (!result.success) {
      toast.error(localizeError(tErrors, result.error, "login"));
      return;
    }

    toast.success(tActions("welcomeBack"));
    // `replace` so Back does not return to the login form, and `refresh` so
    // the guarded layout re-runs with the cookies that were just set.
    router.replace("/");
    router.refresh();
  };

  return { form, onSubmit: form.handleSubmit(submit) };
}
