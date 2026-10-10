"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/frontend/ui";
import { useQueryState } from "../../../../hooks/use-query-state";
import { ROLES } from "../../../../types/api/users";

const ALL = "all";

export function RoleFilter() {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("roles");
  const { searchParams, setQuery } = useQueryState();
  const value = searchParams.get("role") ?? ALL;

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        setQuery({ role: next === ALL ? undefined : next })
      }
    >
      <SelectTrigger
        className="w-full sm:w-[190px]"
        aria-label={t("filterByRole")}
      >
        <SelectValue placeholder={t("allRoles")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t("allRoles")}</SelectItem>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {tRoles(role)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
