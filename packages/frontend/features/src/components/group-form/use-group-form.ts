"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import * as yup from "yup";
import { toast } from "sonner";
import { useRouter } from "@repo/frontend/i18n/navigation";
import {
  createGroupAction,
  updateGroupAction,
} from "../../actions/groups-actions";
import type { Group } from "../../types/api/groups";
import { localizeError } from "../../utils/localize-error";

// Mirrors the API's CreateGroupDto constraints.
const NAME = { min: 2, max: 100 };
const DESCRIPTION = { max: 1000 };

type T = ReturnType<typeof useTranslations<"validation">>;

const buildSchema = (t: T) =>
  yup.object().shape({
    name: yup
      .string()
      .min(NAME.min, t("nameMin", NAME))
      .max(NAME.max, t("nameMax", NAME))
      .required(t("nameRequired")),
    description: yup
      .string()
      .max(DESCRIPTION.max, t("descriptionMax", DESCRIPTION))
      .default(""),
    permissions: yup
      .array(yup.string().required())
      .min(1, t("permissionsRequired"))
      .required(t("permissionsRequired")),
  });

export type GroupFormInputs = yup.InferType<ReturnType<typeof buildSchema>>;

export function useGroupForm(group?: Group) {
  const router = useRouter();
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");

  const form = useForm<GroupFormInputs>({
    resolver: yupResolver(buildSchema(tValidation)),
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      permissions: group?.permissions ?? [],
    },
  });

  const submit: SubmitHandler<GroupFormInputs> = async (data) => {
    if (group) {
      const result = await updateGroupAction(group.id, {
        name: data.name,
        description: data.description || null,
        permissions: data.permissions,
      });

      if (!result.success) {
        toast.error(localizeError(tErrors, result.error, "updateGroup"));
        return;
      }

      toast.success(tActions("groupUpdated"));
      router.refresh();
      return;
    }

    const result = await createGroupAction({
      name: data.name,
      description: data.description || null,
      permissions: data.permissions,
    });

    if (!result.success) {
      toast.error(localizeError(tErrors, result.error, "createGroup"));
      return;
    }

    toast.success(tActions("groupCreated"));
    router.replace(`/groups/${result.data.id}`);
  };

  return { form, isEdit: !!group, onSubmit: form.handleSubmit(submit) };
}
