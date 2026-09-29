"use client";

import { toast } from "sonner";
import { Button, CardContent, CardFooter } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import { useLoginForm } from "../hooks/use-login-form";

const FORM_ID = "login-form";

export function LoginForm() {
  const { form, onSubmit } = useLoginForm();
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

      <CardFooter className="flex-col gap-3 p-0">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          form={FORM_ID}
          loading={isSubmitting}
          size="lg"
        >
          Login
        </Button>
        <Button
          type="button"
          size="lg"
          className="w-full cursor-pointer"
          variant="outline"
          onClick={() => toast.info("Login with Google (stub)")}
        >
          Login with Google
        </Button>
      </CardFooter>
    </>
  );
}
