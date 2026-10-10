import { Layout } from "../components/layout.tsx";
import { Note, Paragraph, Title } from "../components/parts.tsx";
import { v, type EmailProps } from "../i18n.ts";

export default function LoginNotification(
  props: EmailProps & { logoUrl: string },
) {
  const { t, common } = props;
  return (
    <Layout {...props}>
      <Title>{t("title")}</Title>
      <Paragraph>{common("greeting")}</Paragraph>
      <Paragraph>{t("intro")}</Paragraph>
      <Paragraph>
        {t("timeLabel")} <strong>{v("time")}</strong>
      </Paragraph>
      <Note>{t("notYou")}</Note>
    </Layout>
  );
}
