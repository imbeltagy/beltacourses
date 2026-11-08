"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertTitle, Skeleton } from "@repo/frontend/ui";
import { getPermissionCatalogAction } from "../../../../actions/groups-actions";
import { GroupForm } from "../../../../components/group-form";
import { useApi } from "../../../../hooks/use-api";
import { localizeError } from "../../../../utils/localize-error";

/** Fetches the catalog in the browser; the server page owns the title. */
export function GroupCreateContent() {
  const tErrors = useTranslations("errors");
  const { data: catalog, error } = useApi(getPermissionCatalogAction, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {localizeError(tErrors, error, "permissionCatalog")}
        </AlertTitle>
      </Alert>
    );
  }

  if (!catalog) {
    return <Skeleton className="h-64 max-w-3xl" />;
  }

  return <GroupForm catalog={catalog} />;
}
