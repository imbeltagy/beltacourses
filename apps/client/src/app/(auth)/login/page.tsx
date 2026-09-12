"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Button, Card, CardContent, CardFooter, CardHeader } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";

interface FormInputs {
  email: string;
}

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
});

export default function LoginPage() {
  const form = useForm<FormInputs>({
    resolver: yupResolver(schema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    console.log(data);
    toast.success("Logged in (stub) — no request was sent");
  };

  return (
    <Card className="w-[400px] max-w-full border-none p-0 shadow-none">
      <CardHeader className="p-0">
        <h1 className="mb-0 text-2xl font-bold md:text-4xl">Welcome back</h1>
        <p className="text-muted-foreground">Please enter your details</p>
      </CardHeader>

      <CardContent className="p-0">
        <Form onSubmit={handleSubmit(onSubmit)} methods={form} id="login-form">
          <RHFInput name="email" label="Email" type="email" />
        </Form>
      </CardContent>

      <CardFooter className="flex-col gap-3 p-0">
        <Button
          type="submit"
          className="w-full cursor-pointer"
          form="login-form"
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
    </Card>
  );
}
