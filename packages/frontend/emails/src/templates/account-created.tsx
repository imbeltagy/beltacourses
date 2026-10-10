import { Layout } from "../components/layout.tsx";
import { Action, Note, Paragraph, Title } from "../components/parts.tsx";
import { v, type EmailProps } from "../i18n.ts";

export default function AccountCreated(
  props: EmailProps & { logoUrl: string },
) {
  const { t, common } = props;
  return (
    <Layout {...props}>
      <Title>{t("title")}</Title>
      <Paragraph>{common("greeting")}</Paragraph>
      <Paragraph>{t("intro")}</Paragraph>
      <Paragraph>
        {t("emailLabel")} <strong>{v("email")}</strong>
      </Paragraph>
      <Action href={v("loginUrl")}>{t("action")}</Action>
      <Note>{common("ignore")}</Note>
    </Layout>
  );
}
