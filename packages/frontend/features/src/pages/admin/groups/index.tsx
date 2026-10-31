import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Alert, AlertTitle, Button } from "@repo/frontend/ui";
import { Link } from "@repo/frontend/i18n/navigation";
import { listGroupsAction } from "../../../actions/groups-actions";
import { PageWrapper } from "../../../components/page-wrapper";
import { TablePagination } from "../../../components/table-pagination";
import { TableSearch } from "../../../components/table-search";
import { localizeError } from "../../../utils/localize-error";
import { DEFAULT_PAGE_SIZE } from "../../../types/api/common";
import { GroupsTable } from "./components/groups-table";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, t, tErrors] = await Promise.all([
    searchParams,
    getTranslations("admin.groups"),
    getTranslations("errors"),
  ]);

  const page = toPositiveInt(params.page) ?? 1;
  const search = typeof params.search === "string" ? params.search : undefined;

  const result = await listGroupsAction({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search,
  });

  return (
    <PageWrapper
      title={t("title")}
      description={t("description")}
      action={
        <Button asChild>
          <Link href="/groups/new">
            <Plus aria-hidden="true" />
            {t("new")}
          </Link>
        </Button>
      }
    >
      <div className="pb-4">
        <TableSearch
          placeholder={t("searchPlaceholder")}
          label={t("searchLabel")}
        />
      </div>

      {!result.success ? (
        <Alert variant="destructive">
          <AlertTitle>
            {localizeError(tErrors, result.error, "listGroups")}
          </AlertTitle>
        </Alert>
      ) : (
        <>
          <GroupsTable groups={result.data.data} />
          <TablePagination
            page={result.data.meta.page}
            limit={result.data.meta.limit}
            total={result.data.meta.total}
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
