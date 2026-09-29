"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
  role: yup.string<"student" | "teacher">().required("Role is required"),
  bio: yup.string().default(""),
});

export type RegisterFormInputs = yup.InferType<typeof schema>;

export const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
];

export function useRegisterForm() {
  const form = useForm<RegisterFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { role: "student" },
  });

  const submit: SubmitHandler<RegisterFormInputs> = async () => {
    // TODO: call registerAction once `src/actions` lands.
    toast.error("Registration is not connected to the API yet.");
  };

  return {
    form,
    onSubmit: form.handleSubmit(submit),
    // Watched rather than mirrored into `useState`: the radio group is the
    // single source of truth, so the bio field cannot drift out of sync.
    isTeacher: form.watch("role") === "teacher",
  };
}
