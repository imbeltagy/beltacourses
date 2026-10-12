import { getTranslations } from "next-intl/server";
import { Alert, AlertTitle } from "@repo/frontend/ui";
import { getPermissionCatalogAction } from "../../../actions/groups-actions";
import { GroupForm } from "../../../components/group-form";
import { PageWrapper } from "../../../components/page-wrapper";
import { localizeError } from "../../../utils/localize-error";

export default async function CreateGroupPage() {
  const [t, tErrors, catalog] = await Promise.all([
    getTranslations("admin.groups.create"),
    getTranslations("errors"),
    getPermissionCatalogAction(),
  ]);

  return (
    <PageWrapper title={t("title")} description={t("description")}>
      {catalog.success ? (
        <GroupForm catalog={catalog.data} />
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
