import { getTranslations } from "next-intl/server";
import { PageWrapper } from "../../../components/page-wrapper";
import { GroupCreateContent } from "./components/group-create-content";

export default async function CreateGroupPage() {
  const t = await getTranslations("admin.groups.create");

  return (
    <PageWrapper title={t("title")} description={t("description")}>
      <GroupCreateContent />
    </PageWrapper>
  );
}
