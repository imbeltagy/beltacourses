"use client";

import { notFound } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import {
  Alert,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Skeleton,
} from "@repo/frontend/ui";
import { listGroupsAction } from "../../../../actions/groups-actions";
import { getUserAction } from "../../../../actions/users-actions";
import { PageWrapper } from "../../../../components/page-wrapper";
import { UserForm } from "../../../../components/user-form";
import { DATE_FORMAT } from "../../../../configs/formats";
import { useApi } from "../../../../hooks/use-api";
import { localizeError } from "../../../../utils/localize-error";
import { DeleteUserButton } from "./delete-user-button";
import { UserGroupCard } from "./user-group-card";

/** The API caps `limit` at 100; more groups than that would need a search box. */
const GROUP_PICKER_LIMIT = 100;

/** Fetches in the browser: the server page only unwraps the route `params`. */
export function UserDetailsContent({ id }: { id: string }) {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("roles");
  const tErrors = useTranslations("errors");
  const format = useFormatter();

  const { data: user, error, refetch } = useApi(() => getUserAction(id), [id]);

  // Only an admin can hold a group, so only an admin needs the group list.
  const { data: groups, error: groupsError } = useApi(
    () => listGroupsAction({ limit: GROUP_PICKER_LIMIT }),
    [],
    { enabled: user?.role === "admin" },
  );

  if (error) {
    // During render, not in an effect: `notFound()` works by throwing.
    if (error === "USER_NOT_FOUND") notFound();

    return (
      <PageWrapper title={t("title")}>
        <Alert variant="destructive">
          <AlertTitle>{localizeError(tErrors, error, "getUser")}</AlertTitle>
        </Alert>
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper title={t("title")}>
        <Skeleton className="h-64 w-full" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={user.name}
      description={t("details.description", {
        created: format.dateTime(new Date(user.created_at), DATE_FORMAT),
      })}
      action={<DeleteUserButton userId={user.id} />}
    >
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="size-16">
          {user.avatar && <AvatarImage src={user.avatar.url} alt="" />}
          <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{tRoles(user.role)}</Badge>
          <Badge variant={user.confirmed ? "default" : "outline"}>
            {user.confirmed ? t("confirmed") : t("pending")}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Keyed by `updated_at` so a save remounts the form on the new values. */}
        <UserForm key={user.updated_at} user={user} onSaved={refetch} />

        {user.role === "admin" &&
          (groupsError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {localizeError(tErrors, groupsError, "listGroups")}
              </AlertTitle>
            </Alert>
          ) : groups ? (
            <UserGroupCard user={user} groups={groups.data} onSaved={refetch} />
          ) : (
            <Skeleton className="h-32 max-w-2xl" />
          ))}
      </div>
    </PageWrapper>
  );
}
