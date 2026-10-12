"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/frontend/ui";
import { useRouter } from "@repo/frontend/i18n/navigation";
import {
  assignUserToGroupAction,
  unassignUserFromGroupAction,
} from "../../../../actions/groups-actions";
import type { Group } from "../../../../types/api/groups";
import type { User } from "../../../../types/api/users";
import { localizeError } from "../../../../utils/localize-error";

const NONE = "none";

/**
 * Only an admin can hold a group, so the page renders this for admins alone.
 * Changing the group ends the user's live sessions on the API side — that is
 * how their permissions refresh — and the card says so up front.
 */
export function UserGroupCard({
  user,
  groups,
}: {
  user: User;
  groups: Group[];
}) {
  const t = useTranslations("admin.users.group");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const change = async (next: string) => {
    const current = user.group?.id;
    if (next === (current ?? NONE)) return;

    setPending(true);

    // `current` is set whenever `next` is NONE: the no-op check above returned
    // otherwise, so there is a group to remove.
    const result =
      next === NONE && current
        ? await unassignUserFromGroupAction(current, user.id)
        : await assignUserToGroupAction(next, user.id);

    setPending(false);

    if (!result.success) {
      toast.error(
        localizeError(
          tErrors,
          result.error,
          next === NONE ? "unassignGroup" : "assignGroup",
        ),
      );
      return;
    }

    toast.success(tActions("groupAssignmentUpdated"));
    router.refresh();
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("hint")}</p>
      </CardHeader>
      <CardContent>
        <Select
          value={user.group?.id ?? NONE}
          onValueChange={change}
          disabled={pending}
        >
          <SelectTrigger className="w-full" aria-label={t("title")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("none")}</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
