"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/frontend/ui";
import { useQueryState } from "../../../../hooks/use-query-state";
import { ROLES, ROLE_LABELS } from "../../../../types/api/users";

const ALL = "all";

export function RoleFilter() {
  const { searchParams, setQuery } = useQueryState();
  const value = searchParams.get("role") ?? ALL;

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        setQuery({ role: next === ALL ? undefined : next })
      }
    >
      <SelectTrigger className="w-full sm:w-[190px]" aria-label="Filter by role">
        <SelectValue placeholder="All roles" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All roles</SelectItem>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
