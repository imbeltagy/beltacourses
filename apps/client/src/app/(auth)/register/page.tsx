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
import { FormInput } from "@repo/frontend/components/form/form-input";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  role: yup.string<"student" | "teacher">().required("Role is required"),
  bio: yup.string().default(""),
});

type FormInputs = yup.InferType<typeof schema>;

const PLACEHOLDER_EMAIL = "invited-user@example.com";

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
    console.log({ ...data, email: PLACEHOLDER_EMAIL });
    toast.success("Registered (stub) — no request was sent");
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
          <FormInput
            label="Email"
            type="email"
            value={PLACEHOLDER_EMAIL}
            disabled
          />
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
