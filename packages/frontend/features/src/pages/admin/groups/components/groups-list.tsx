"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertTitle, Skeleton } from "@repo/frontend/ui";
import { listGroupsAction } from "../../../../actions/groups-actions";
import { TablePagination } from "../../../../components/table-pagination";
import { useApi } from "../../../../hooks/use-api";
import { DEFAULT_PAGE_SIZE } from "../../../../types/api/common";
import { localizeError } from "../../../../utils/localize-error";
import { GroupsTable } from "./groups-table";

/** Fetches in the browser: the server page only parses the URL into props. */
export function GroupsList({
  page,
  search,
}: {
  page: number;
  search?: string;
}) {
  const tErrors = useTranslations("errors");
  const { data, error } = useApi(
    () => listGroupsAction({ page, limit: DEFAULT_PAGE_SIZE, search }),
    [page, search],
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{localizeError(tErrors, error, "listGroups")}</AlertTitle>
      </Alert>
    );
  }

  if (!data) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <>
      <GroupsTable groups={data.data} />
      <TablePagination
        page={data.meta.page}
        limit={data.meta.limit}
        total={data.meta.total}
      />
    </>
  );
}
