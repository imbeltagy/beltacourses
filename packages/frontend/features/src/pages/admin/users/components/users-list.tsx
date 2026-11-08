"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertTitle, Skeleton } from "@repo/frontend/ui";
import { listUsersAction } from "../../../../actions/users-actions";
import { TablePagination } from "../../../../components/table-pagination";
import { useApi } from "../../../../hooks/use-api";
import { DEFAULT_PAGE_SIZE } from "../../../../types/api/common";
import type { Role } from "../../../../types/api/users";
import { localizeError } from "../../../../utils/localize-error";
import { UsersTable } from "./users-table";

/** Fetches in the browser: the server page only parses the URL into props. */
export function UsersList({
  page,
  search,
  role,
}: {
  page: number;
  search?: string;
  role?: Role;
}) {
  const tErrors = useTranslations("errors");
  const { data, error } = useApi(
    () => listUsersAction({ page, limit: DEFAULT_PAGE_SIZE, search, role }),
    [page, search, role],
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{localizeError(tErrors, error, "listUsers")}</AlertTitle>
      </Alert>
    );
  }

  if (!data) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <>
      <UsersTable users={data.data} />
      <TablePagination
        page={data.meta.page}
        limit={data.meta.limit}
        total={data.meta.total}
      />
    </>
  );
}
