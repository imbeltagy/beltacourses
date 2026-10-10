"use client";

import { useTranslations } from "next-intl";
import { Button, CardContent, CardFooter } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import { RHFRadioGroup } from "@repo/frontend/components/form/rhf-radio-group";
import { useRegisterForm } from "../hooks/use-register-form";

const FORM_ID = "register-form";

export function RegisterForm() {
  const t = useTranslations();
  const { form, onSubmit, isTeacher, roleOptions } = useRegisterForm();
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
          <RHFInput name="name" label={t("common.fullName")} type="text" />
          <RHFInput name="email" label={t("common.email")} type="email" />
          <RHFInput
            name="password"
            label={t("common.password")}
            type="password"
          />
          <RHFRadioGroup
            name="role"
            label={t("auth.register.roleLabel")}
            options={roleOptions}
          />

          {isTeacher && (
            <RHFInput name="bio" label={t("common.bio")} multiline />
          )}
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
          {t("auth.register.submit")}
        </Button>
      </CardFooter>
    </>
  );
}
