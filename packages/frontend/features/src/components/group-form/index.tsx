"use client";

import { useTranslations } from "next-intl";
import { Button } from "@repo/frontend/ui";
import { Form } from "@repo/frontend/components/form/form-provider";
import { RHFInput } from "@repo/frontend/components/form/rhf-input";
import type { Group, PermissionCatalog } from "../../types/api/groups";
import { PermissionPicker } from "./permission-picker";
import { useGroupForm } from "./use-group-form";

/** Create when `group` is absent, edit when present. */
export function GroupForm({
  group,
  catalog,
}: {
  group?: Group;
  catalog: PermissionCatalog;
}) {
  const t = useTranslations("admin.groups.form");
  const tCommon = useTranslations("common");
  const { form, isEdit, onSubmit } = useGroupForm(group);
  const { isSubmitting } = form.formState;

  return (
    <Form
      onSubmit={onSubmit}
      methods={form}
      className="flex max-w-3xl flex-col gap-4"
    >
      <RHFInput name="name" label={tCommon("name")} type="text" />
      <RHFInput
        name="description"
        label={t("description")}
        multiline
        rows={3}
      />
      <PermissionPicker name="permissions" catalog={catalog} />

      <div>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? t("save") : t("create")}
        </Button>
      </div>
    </Form>
  );
}
