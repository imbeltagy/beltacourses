"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { loginAction } from "../../../../actions/auth-actions";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

export type LoginFormInputs = yup.InferType<typeof schema>;

/**
 * Owns the schema, the form instance and the submit handler, so
 * `components/login-form.tsx` stays pure markup and does not change when the
 * API call behind the submit does.
 */
export function useLoginForm() {
  const form = useForm<LoginFormInputs>({ resolver: yupResolver(schema) });

  const submit: SubmitHandler<LoginFormInputs> = async (data) => {
    const result = await loginAction(data);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
  };

  return { form, onSubmit: form.handleSubmit(submit) };
}
