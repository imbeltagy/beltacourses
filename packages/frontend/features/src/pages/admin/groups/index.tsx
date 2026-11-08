import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Button } from "@repo/frontend/ui";
import { Link } from "@repo/frontend/i18n/navigation";
import { PageWrapper } from "../../../components/page-wrapper";
import { TableSearch } from "../../../components/table-search";
import { GroupsList } from "./components/groups-list";

/**
 * List state comes from the URL, so this stays a server component: it reads
 * `searchParams` and passes them to `GroupsList`, which fetches in the browser.
 */
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

      <GroupsList page={page} search={search} />
    </PageWrapper>
  );
}

function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
