"use client";

import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { loginModeratorAction } from "../../../../actions/auth-actions";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export type ModeratorLoginInputs = yup.InferType<typeof schema>;

export function useModeratorLoginForm() {
  const router = useRouter();
  const form = useForm<ModeratorLoginInputs>({ resolver: yupResolver(schema) });

  const submit: SubmitHandler<ModeratorLoginInputs> = async (data) => {
    const result = await loginModeratorAction(data);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    // `replace` so Back does not return to the login form, and `refresh` so
    // the guarded layout re-runs with the cookies that were just set.
    router.replace("/");
    router.refresh();
  };

  return { form, onSubmit: form.handleSubmit(submit) };
}
