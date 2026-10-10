import { getTranslations } from "next-intl/server";
import { Alert, AlertTitle } from "@repo/frontend/ui";
import { listGroupsAction } from "../../../actions/groups-actions";
import { PageWrapper } from "../../../components/page-wrapper";
import { TablePagination } from "../../../components/table-pagination";
import { TableSearch } from "../../../components/table-search";
import { DEFAULT_PAGE_SIZE } from "../../../types/api/common";
import { GroupsTable } from "./components/groups-table";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("admin.groups"),
  ]);

  const page = toPositiveInt(params.page) ?? 1;
  const search = typeof params.search === "string" ? params.search : undefined;

  const result = await listGroupsAction({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search,
  });

  return (
    <PageWrapper title={t("title")} description={t("description")}>
      <div className="pb-4">
        <TableSearch
          placeholder={t("searchPlaceholder")}
          label={t("searchLabel")}
        />
      </div>

      {!result.success ? (
        <Alert variant="destructive">
          <AlertTitle>{result.message}</AlertTitle>
        </Alert>
      ) : (
        <>
          <GroupsTable groups={result.data.items} />
          <TablePagination
            page={result.data.page}
            limit={result.data.limit}
            total={result.data.total}
          />
        </>
      )}
    </PageWrapper>
  );
}

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
