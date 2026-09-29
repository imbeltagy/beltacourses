"use client";

import { Button, CardContent, CardFooter } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import { RHFRadioGroup } from "@repo/frontend/components/form/rhf-radio-group";
import { ROLE_OPTIONS, useRegisterForm } from "../hooks/use-register-form";

const FORM_ID = "register-form";

export function RegisterForm() {
  const { form, onSubmit, isTeacher } = useRegisterForm();
  const { isSubmitting } = form.formState;

  return (
    <>
      <CardContent className="p-0">
        <Form
          onSubmit={onSubmit}
          methods={form}
          id={FORM_ID}
          className="flex flex-col gap-4"
        >
          <RHFInput name="name" label="Full Name" type="text" />
          <RHFInput name="email" label="Email" type="email" />
          <RHFInput name="password" label="Password" type="password" />
          <RHFRadioGroup name="role" label="I'm a..." options={ROLE_OPTIONS} />

          {isTeacher && <RHFInput name="bio" label="Bio" multiline />}
        </Form>
      </CardContent>

      <CardFooter className="flex-col gap-3 p-0">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          form={FORM_ID}
          loading={isSubmitting}
          size="lg"
        >
          Register
        </Button>
      </CardFooter>
    </>
  );
}
