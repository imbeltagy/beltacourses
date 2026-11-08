import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Button } from "@repo/frontend/ui";
import { Link } from "@repo/frontend/i18n/navigation";
import { PageWrapper } from "../../../components/page-wrapper";
import { TableSearch } from "../../../components/table-search";
import { ROLES, type Role } from "../../../types/api/users";
import { RoleFilter } from "./components/role-filter";
import { UsersList } from "./components/users-list";

/**
 * List state comes from the URL, so this stays a server component: it reads
 * `searchParams` and passes them to `UsersList`, which fetches in the browser.
 * The filter controls, the pager and the list are client components.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations("admin.users"),
  ]);

  const page = toPositiveInt(params.page) ?? 1;
  const search = typeof params.search === "string" ? params.search : undefined;
  const role = toRole(params.role);

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

      <UsersList page={page} search={search} role={role} />
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
