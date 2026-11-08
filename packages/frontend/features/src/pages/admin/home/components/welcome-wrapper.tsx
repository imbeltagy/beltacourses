"use client";

import { useTranslations } from "next-intl";
import { PageWrapper } from "../../../../components/page-wrapper";
import { useCurrentUser } from "../../../../hooks/use-current-user";

/** Names the user in the title once loaded; generic `welcome` until then. */
export function WelcomeWrapper({
  description,
  children,
}: {
  description: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin.home");
  const { user } = useCurrentUser();

  return (
    <PageWrapper
      title={
        user
          ? t("welcomeNamed", { name: user.name.split(" ")[0] ?? user.name })
          : t("welcome")
      }
      description={description}
    >
      {children}
    </PageWrapper>
  );
}
