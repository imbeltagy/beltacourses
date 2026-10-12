import { getTranslations } from "next-intl/server";
import { PageWrapper } from "../../../components/page-wrapper";
import { UserForm } from "../../../components/user-form";

export default async function CreateUserPage() {
  const t = await getTranslations("admin.users.create");

  return (
    <PageWrapper title={t("title")} description={t("description")}>
      <UserForm />
    </PageWrapper>
  );
}
