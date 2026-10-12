import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, AlertTitle, Badge } from "@repo/frontend/ui";
import {
  getGroupAction,
  getPermissionCatalogAction,
} from "../../../actions/groups-actions";
import { GroupForm } from "../../../components/group-form";
import { PageWrapper } from "../../../components/page-wrapper";
import { DATE_FORMAT } from "../../../configs/formats";
import { localizeError } from "../../../utils/localize-error";
import { DeleteGroupButton } from "./components/delete-group-button";

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, tErrors, format, group, catalog] = await Promise.all([
    getTranslations("admin.groups"),
    getTranslations("errors"),
    getFormatter(),
    getGroupAction(id),
    getPermissionCatalogAction(),
  ]);

  if (!group.success) {
    if (group.error === "GROUP_NOT_FOUND") notFound();

    return (
      <PageWrapper title={t("title")}>
        <Alert variant="destructive">
          <AlertTitle>
            {localizeError(tErrors, group.error, "getGroup")}
          </AlertTitle>
        </Alert>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={group.data.name}
      description={t("details.description", {
        count: group.data.users_count,
        created: format.dateTime(new Date(group.data.created_at), DATE_FORMAT),
      })}
      action={<DeleteGroupButton groupId={group.data.id} />}
    >
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="secondary">
          {t("details.members", { count: group.data.users_count })}
        </Badge>
      </div>

      {catalog.success ? (
        // Keyed by `updated_at` so a save remounts the form on the new values.
        <GroupForm
          key={group.data.updated_at}
          group={group.data}
          catalog={catalog.data}
        />
      ) : (
        <Alert variant="destructive">
          <AlertTitle>
            {localizeError(tErrors, catalog.error, "permissionCatalog")}
          </AlertTitle>
        </Alert>
      )}
    </PageWrapper>
  );
}
