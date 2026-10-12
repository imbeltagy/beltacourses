import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Alert, AlertTitle, Button } from "@repo/frontend/ui";
import { Link } from "@repo/frontend/i18n/navigation";
import { listUsersAction } from "../../../actions/users-actions";
import { PageWrapper } from "../../../components/page-wrapper";
import { TablePagination } from "../../../components/table-pagination";
import { TableSearch } from "../../../components/table-search";
import { localizeError } from "../../../utils/localize-error";
import { DEFAULT_PAGE_SIZE } from "../../../types/api/common";
import { ROLES, type Role } from "../../../types/api/users";
import { RoleFilter } from "./components/role-filter";
import { UsersTable } from "./components/users-table";

/**
 * List state comes from the URL, so this stays a server component: it reads
 * `searchParams`, fetches, and renders. Only the filter controls and the
 * pager are client components.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, t, tErrors] = await Promise.all([
    searchParams,
    getTranslations("admin.users"),
    getTranslations("errors"),
  ]);

  const page = toPositiveInt(params.page) ?? 1;
  const search = typeof params.search === "string" ? params.search : undefined;
  const role = toRole(params.role);

  const result = await listUsersAction({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search,
    role,
  });

  return (
    <PageWrapper
      title={t("title")}
      description={t("description")}
      action={
        <Button asChild>
          <Link href="/users/new">
            <Plus aria-hidden="true" />
            {t("new")}
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center">
        <TableSearch
          placeholder={t("searchPlaceholder")}
          label={t("searchLabel")}
        />
        <RoleFilter />
      </div>

      {!result.success ? (
        <Alert variant="destructive">
          <AlertTitle>
            {localizeError(tErrors, result.error, "listUsers")}
          </AlertTitle>
        </Alert>
      ) : (
        <>
          <UsersTable users={result.data.items} />
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

/** Anything the API would 400 on is dropped rather than forwarded. */
function toRole(value: unknown): Role | undefined {
  return typeof value === "string" &&
    (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : undefined;
}
