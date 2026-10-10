import { Layout } from "../components/layout.tsx";
import { Action, Note, Paragraph, Title } from "../components/parts.tsx";
import { v, type EmailProps } from "../i18n.ts";

export default function VerifyEmail(props: EmailProps & { logoUrl: string }) {
  const { t, common } = props;
  return (
    <Layout {...props}>
      <Title>{t("title")}</Title>
      <Paragraph>{common("greeting")}</Paragraph>
      <Paragraph>{t("intro")}</Paragraph>
      <Action href={v("verifyUrl")}>{t("action")}</Action>
      <Note>{t("expiry")}</Note>
      <Note>{common("ignore")}</Note>
    </Layout>
  );
}
