"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@repo/frontend/i18n/navigation";
import { deleteGroupAction } from "../../../../actions/groups-actions";
import { ConfirmDeleteButton } from "../../../../components/confirm-delete-button";
import { localizeError } from "../../../../utils/localize-error";

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const t = useTranslations("admin.groups");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const router = useRouter();

  return (
    <ConfirmDeleteButton
      label={t("delete")}
      onConfirm={async () => {
        const result = await deleteGroupAction(groupId);

        if (!result.success) {
          toast.error(localizeError(tErrors, result.error, "deleteGroup"));
          return;
        }

        toast.success(tActions("groupDeleted"));
        router.replace("/groups");
      }}
    />
  );
}
