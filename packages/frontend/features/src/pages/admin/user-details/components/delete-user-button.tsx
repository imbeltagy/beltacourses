"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@repo/frontend/i18n/navigation";
import { deleteUserAction } from "../../../../actions/users-actions";
import { ConfirmDeleteButton } from "../../../../components/confirm-delete-button";
import { localizeError } from "../../../../utils/localize-error";

export function DeleteUserButton({ userId }: { userId: string }) {
  const t = useTranslations("admin.users");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const router = useRouter();

  return (
    <ConfirmDeleteButton
      label={t("delete")}
      onConfirm={async () => {
        const result = await deleteUserAction(userId);

        if (!result.success) {
          toast.error(localizeError(tErrors, result.error, "deleteUser"));
          return;
        }

        toast.success(tActions("userDeleted"));
        router.replace("/users");
      }}
    />
  );
}
