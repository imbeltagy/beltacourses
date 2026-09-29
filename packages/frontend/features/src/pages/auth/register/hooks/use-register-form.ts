"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { registerAction } from "../../../../actions/auth-actions";
import type { RegisterableRole } from "../../../../types/api/auth";

// Mirrors the API's RegisterDto constraints so a bad field is caught before
// the round trip; the API still validates on its own side.
const schema = yup.object().shape({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .required("Password is required"),
  role: yup.string<RegisterableRole>().required("Role is required"),
  bio: yup.string().default(""),
});

export type RegisterFormInputs = yup.InferType<typeof schema>;

export const ROLE_OPTIONS: { value: RegisterableRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
];

export function useRegisterForm() {
  const form = useForm<RegisterFormInputs>({
    resolver: yupResolver(schema),
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
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
  };

  return {
    form,
    onSubmit: form.handleSubmit(submit),
    // Watched rather than mirrored into `useState`: the radio group is the
    // single source of truth, so the bio field cannot drift out of sync.
    isTeacher: form.watch("role") === "teacher",
  };
}
