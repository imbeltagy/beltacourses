import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  Alert,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from "@repo/frontend/ui";
import { listGroupsAction } from "../../../actions/groups-actions";
import { getUserAction } from "../../../actions/users-actions";
import { PageWrapper } from "../../../components/page-wrapper";
import { UserForm } from "../../../components/user-form";
import { DATE_FORMAT } from "../../../configs/formats";
import { localizeError } from "../../../utils/localize-error";
import { DeleteUserButton } from "./components/delete-user-button";
import { UserGroupCard } from "./components/user-group-card";

/** The API caps `limit` at 100; more groups than that would need a search box. */
const GROUP_PICKER_LIMIT = 100;

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, tRoles, tErrors, format, user] = await Promise.all([
    getTranslations("admin.users"),
    getTranslations("roles"),
    getTranslations("errors"),
    getFormatter(),
    getUserAction(id),
  ]);

  if (!user.success) {
    if (user.error === "USER_NOT_FOUND") notFound();

    return (
      <PageWrapper title={t("title")}>
        <Alert variant="destructive">
          <AlertTitle>
            {localizeError(tErrors, user.error, "getUser")}
          </AlertTitle>
        </Alert>
      </PageWrapper>
    );
  }

  // Only an admin can hold a group, so only an admin needs the group list.
  const groups =
    user.data.role === "admin"
      ? await listGroupsAction({ limit: GROUP_PICKER_LIMIT })
      : null;

  return (
    <PageWrapper
      title={user.data.name}
      description={t("details.description", {
        created: format.dateTime(new Date(user.data.created_at), DATE_FORMAT),
      })}
      action={<DeleteUserButton userId={user.data.id} />}
    >
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="size-16">
          {user.data.avatar && (
            <AvatarImage src={user.data.avatar.url} alt="" />
          )}
          <AvatarFallback>
            {user.data.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{tRoles(user.data.role)}</Badge>
          <Badge variant={user.data.confirmed ? "default" : "outline"}>
            {user.data.confirmed ? t("confirmed") : t("pending")}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Keyed by `updated_at` so a save remounts the form on the new values. */}
        <UserForm key={user.data.updated_at} user={user.data} />

        {groups &&
          (groups.success ? (
            <UserGroupCard user={user.data} groups={groups.data.items} />
          ) : (
            <Alert variant="destructive">
              <AlertTitle>
                {localizeError(tErrors, groups.error, "listGroups")}
              </AlertTitle>
            </Alert>
          ))}
      </div>
    </PageWrapper>
  );
}
