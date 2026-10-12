"use client";

import { useTranslations } from "next-intl";
import { Button } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFCheckbox } from "@repo/frontend/components/form/rhf-checkbox";
import { RHFFileInput } from "@repo/frontend/components/form/rhf-file-input";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import { RHFSelect } from "@repo/frontend/components/form/rhf-select";
import type { User } from "../../types/api/users";
import { useUserForm } from "./use-user-form";

/** Create when `user` is absent, edit when present. */
export function UserForm({ user }: { user?: User }) {
  const t = useTranslations("admin.users.form");
  const tCommon = useTranslations("common");
  const { form, isEdit, onSubmit, roleOptions, genderOptions } =
    useUserForm(user);
  const { isSubmitting } = form.formState;

  return (
    <Form
      onSubmit={onSubmit}
      methods={form}
      className="flex max-w-2xl flex-col gap-4"
    >
      <RHFInput name="name" label={tCommon("fullName")} type="text" />

      {isEdit ? (
        // Shown for context but not editable: PATCH /users/:id has no email.
        <RHFInput
          name="email"
          label={tCommon("email")}
          type="email"
          disabled
          helperText={t("emailLocked")}
        />
      ) : (
        <>
          <RHFInput name="email" label={tCommon("email")} type="email" />
          <RHFInput
            name="password"
            label={tCommon("password")}
            type="password"
          />
          <RHFSelect name="role" label={t("role")} options={roleOptions} />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <RHFSelect name="gender" label={t("gender")} options={genderOptions} />
        <RHFInput name="date_of_birth" label={t("dateOfBirth")} type="date" />
      </div>

      <RHFInput name="bio" label={tCommon("bio")} multiline rows={4} />
      <RHFFileInput
        name="avatar"
        label={t("avatar")}
        accept="image/*"
        helperText={isEdit ? t("avatarReplaceHint") : undefined}
      />
      <RHFCheckbox name="confirmed" label={t("confirmed")} />

      <div>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? t("save") : t("create")}
        </Button>
      </div>
    </Form>
  );
}
