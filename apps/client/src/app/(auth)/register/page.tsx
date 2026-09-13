"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Button, Card, CardContent, CardFooter, CardHeader } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import { RHFRadioGroup } from "@repo/frontend/components/form/rhf-radio-group";
import { registerAction } from "./actions";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
  role: yup.string<"student" | "teacher">().required("Role is required"),
  bio: yup.string().default(""),
});

type FormInputs = yup.InferType<typeof schema>;

export default function RegisterPage() {
  const [isTeacher, setIsTeacher] = useState(false);

  const form = useForm<FormInputs>({
    resolver: yupResolver(schema),
    defaultValues: {
      role: "student",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
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

  return (
    <Card className="w-[400px] max-w-full border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <h1 className="mb-0 text-2xl font-bold md:text-4xl">
          Create Account
        </h1>
        <p className="text-muted-foreground">
          Please complete your registration
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <Form
          onSubmit={handleSubmit(onSubmit)}
          methods={form}
          id="register-form"
          className="flex flex-col gap-4"
        >
          <RHFInput name="name" label="Full Name" type="text" />
          <RHFInput name="email" label="Email" type="email" />
          <RHFInput name="password" label="Password" type="password" />
          <RHFRadioGroup
            name="role"
            label="I'm a..."
            options={[
              { value: "student", label: "Student" },
              { value: "teacher", label: "Teacher" },
            ]}
            onChange={(value) => setIsTeacher(value === "teacher")}
          />

          {isTeacher && <RHFInput name="bio" label="Bio" multiline />}
        </Form>
      </CardContent>

      <CardFooter className="flex-col gap-3 p-0">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          form="register-form"
          loading={isSubmitting}
          size="lg"
        >
          Register
        </Button>
      </CardFooter>
    </Card>
  );
}
