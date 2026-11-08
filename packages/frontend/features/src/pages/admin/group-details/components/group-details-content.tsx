"use client";

import { notFound } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Alert, AlertTitle, Badge, Skeleton } from "@repo/frontend/ui";
import {
  getGroupAction,
  getPermissionCatalogAction,
} from "../../../../actions/groups-actions";
import { GroupForm } from "../../../../components/group-form";
import { PageWrapper } from "../../../../components/page-wrapper";
import { DATE_FORMAT } from "../../../../configs/formats";
import { useApi } from "../../../../hooks/use-api";
import { localizeError } from "../../../../utils/localize-error";
import { DeleteGroupButton } from "./delete-group-button";

/** Fetches in the browser: the server page only unwraps the route `params`. */
export function GroupDetailsContent({ id }: { id: string }) {
  const t = useTranslations("admin.groups");
  const tErrors = useTranslations("errors");
  const format = useFormatter();

  const {
    data: group,
    error,
    refetch: refetchGroup,
  } = useApi(() => getGroupAction(id), [id]);
  const { data: catalog, error: catalogError } = useApi(
    getPermissionCatalogAction,
    [],
  );

  if (error) {
    // During render, not in an effect: `notFound()` works by throwing.
    if (error === "GROUP_NOT_FOUND") notFound();

    return (
      <PageWrapper title={t("title")}>
        <Alert variant="destructive">
          <AlertTitle>{localizeError(tErrors, error, "getGroup")}</AlertTitle>
        </Alert>
      </PageWrapper>
    );
  }

  if (!group) {
    return (
      <PageWrapper title={t("title")}>
        <Skeleton className="h-64 w-full" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={group.name}
      description={t("details.description", {
        count: group.users_count,
        created: format.dateTime(new Date(group.created_at), DATE_FORMAT),
      })}
      action={<DeleteGroupButton groupId={group.id} />}
    >
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="secondary">
          {t("details.members", { count: group.users_count })}
        </Badge>
      </div>

      {catalogError ? (
        <Alert variant="destructive">
          <AlertTitle>
            {localizeError(tErrors, catalogError, "permissionCatalog")}
          </AlertTitle>
        </Alert>
      ) : catalog ? (
        // Keyed by `updated_at` so a save remounts the form on the new values.
        <GroupForm
          key={group.updated_at}
          group={group}
          catalog={catalog}
          onSaved={refetchGroup}
        />
      ) : (
        <Skeleton className="h-64 max-w-3xl" />
      )}
    </PageWrapper>
  );
}
