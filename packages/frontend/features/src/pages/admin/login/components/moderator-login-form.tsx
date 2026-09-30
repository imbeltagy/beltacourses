"use client";

import { Button, CardContent, CardFooter } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import { useModeratorLoginForm } from "../hooks/use-moderator-login-form";

const FORM_ID = "moderator-login-form";

export function ModeratorLoginForm() {
  const { form, onSubmit } = useModeratorLoginForm();
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
          <RHFInput name="email" label="Email" type="email" />
          <RHFInput name="password" label="Password" type="password" />
        </Form>
      </CardContent>

      <CardFooter className="p-0">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          form={FORM_ID}
          loading={isSubmitting}
          size="lg"
        >
          Sign in
        </Button>
      </CardFooter>
    </>
  );
}
