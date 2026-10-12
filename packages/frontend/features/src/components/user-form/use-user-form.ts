"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocale, useTranslations } from "next-intl";
import * as yup from "yup";
import { toast } from "sonner";
import { useRouter } from "@repo/frontend/i18n/navigation";
import {
  createUserAction,
  updateUserAction,
} from "../../actions/users-actions";
import {
  ASSIGNABLE_ROLES,
  GENDERS,
  type Gender,
  type User,
} from "../../types/api/users";
import { localizeError } from "../../utils/localize-error";

// Mirrors the API's CreateUserDto / UpdateUserDto constraints.
const NAME = { min: 2, max: 100 };
const PASSWORD = { min: 8, max: 72 };
const BIO = { max: 1000 };

/** Radix reserves `""` for "no selection", so an unset gender needs a value. */
export const NO_GENDER = "none";

type T = ReturnType<typeof useTranslations<"validation">>;

const buildSchema = (t: T, isEdit: boolean) =>
  yup.object().shape({
    name: yup
      .string()
      .min(NAME.min, t("nameMin", NAME))
      .max(NAME.max, t("nameMax", NAME))
      .required(t("nameRequired")),
    // Email, password and role cannot be changed through PATCH /users/:id, so
    // the edit form does not collect them.
    email: isEdit
      ? yup.string().default("")
      : yup.string().email(t("invalidEmail")).required(t("emailRequired")),
    password: isEdit
      ? yup.string().default("")
      : yup
          .string()
          .min(PASSWORD.min, t("passwordMin", PASSWORD))
          .max(PASSWORD.max, t("passwordMax", PASSWORD))
          .required(t("passwordRequired")),
    role: yup.string().required(t("roleRequired")),
    confirmed: yup.boolean().default(false),
    bio: yup.string().max(BIO.max, t("bioMax", BIO)).default(""),
    gender: yup.string().default(NO_GENDER),
    date_of_birth: yup.string().default(""),
    avatar: yup.mixed<File>().optional(),
  });

export type UserFormInputs = yup.InferType<ReturnType<typeof buildSchema>>;

export function useUserForm(user?: User) {
  const isEdit = !!user;
  const router = useRouter();
  const locale = useLocale();
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("actions");
  const tRoles = useTranslations("roles");
  const tGender = useTranslations("genders");

  const form = useForm<UserFormInputs>({
    resolver: yupResolver(buildSchema(tValidation, isEdit)),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "student",
      confirmed: user?.confirmed ?? false,
      bio: user?.bio ?? "",
      gender: user?.gender ?? NO_GENDER,
      // The API sends an ISO timestamp; <input type="date"> wants `YYYY-MM-DD`.
      date_of_birth: user?.date_of_birth?.slice(0, 10) ?? "",
    },
  });

  const submit: SubmitHandler<UserFormInputs> = async (data) => {
    const gender =
      data.gender === NO_GENDER ? undefined : (data.gender as Gender);

    if (user) {
      const result = await updateUserAction(user.id, {
        name: data.name,
        confirmed: data.confirmed,
        // `null` clears the field; an empty value must not be sent as "".
        bio: data.bio || null,
        gender: gender ?? null,
        date_of_birth: data.date_of_birth || null,
        avatar: data.avatar,
      });

      if (!result.success) {
        toast.error(localizeError(tErrors, result.error, "updateUser"));
        return;
      }

      toast.success(tActions("userUpdated"));
      // Re-run the server page so the header and avatar show the saved values.
      router.refresh();
      return;
    }

    const result = await createUserAction(
      {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as (typeof ASSIGNABLE_ROLES)[number],
        confirmed: data.confirmed,
        bio: data.bio || undefined,
        gender,
        date_of_birth: data.date_of_birth || undefined,
        avatar: data.avatar,
      },
      locale,
    );

    if (!result.success) {
      toast.error(localizeError(tErrors, result.error, "createUser"));
      return;
    }

    toast.success(tActions("userCreated"));
    router.replace(`/users/${result.data.id}`);
  };

  return {
    form,
    isEdit,
    onSubmit: form.handleSubmit(submit),
    roleOptions: ASSIGNABLE_ROLES.map((value) => ({
      value,
      label: tRoles(value),
    })),
    genderOptions: [
      { value: NO_GENDER, label: tGender("none") },
      ...GENDERS.map((value) => ({ value, label: tGender(value) })),
    ],
  };
}
