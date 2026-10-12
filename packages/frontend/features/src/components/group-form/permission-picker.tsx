"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Label } from "@repo/frontend/ui";
import type { PermissionCatalog } from "../../types/api/groups";

/**
 * One section per catalog resource, one checkbox per permission. The form
 * value is the flat list of selected permission strings, which is what the API
 * takes. The catalog is passed in rather than fetched: the page already has it.
 */
export function PermissionPicker({
  name,
  catalog,
}: {
  name: string;
  catalog: PermissionCatalog;
}) {
  const t = useTranslations("admin.groups.form");
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const selected: string[] = value ?? [];
        const toggle = (permission: string, checked: boolean) =>
          onChange(
            checked
              ? [...selected, permission]
              : selected.filter((p) => p !== permission),
          );

        return (
          <fieldset className="flex flex-col gap-3">
            <legend
              className={
                error
                  ? "text-destructive mb-1 text-sm font-medium"
                  : "text-muted-foreground mb-1 text-sm font-medium"
              }
            >
              {t("permissions")}
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(catalog).map(([resource, actions]) => (
                <div key={resource} className="rounded-md border p-3">
                  <div className="mb-2 text-sm font-semibold capitalize">
                    {resource.toLowerCase()}
                  </div>
                  <div className="flex flex-col gap-2">
                    {Object.entries(actions).map(([action, permission]) => {
                      const id = `${name}-${permission}`;
                      return (
                        <div
                          key={permission}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            id={id}
                            checked={selected.includes(permission)}
                            onChange={(event) =>
                              toggle(permission, event.target.checked)
                            }
                            className="border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded focus:ring-2 focus:ring-offset-2"
                          />
                          <Label
                            htmlFor={id}
                            className="cursor-pointer font-mono text-xs font-normal"
                            title={action}
                          >
                            {permission}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error?.message && (
              <p className="text-destructive text-sm">{error.message}</p>
            )}
          </fieldset>
        );
      }}
    />
  );
}
