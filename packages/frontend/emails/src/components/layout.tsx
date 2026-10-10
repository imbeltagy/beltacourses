import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import type { EmailProps } from "../i18n.ts";
import { getDirection } from "../locales.ts";
import { theme } from "../theme.ts";

const font =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif";

export function Layout({
  locale,
  t,
  common,
  logoUrl,
  children,
}: EmailProps & { logoUrl: string; children: ReactNode }) {
  const dir = getDirection(locale);
  const align = dir === "rtl" ? "right" : "left";

  return (
    <Html lang={locale} dir={dir}>
      <Head>
        <title>{t("subject")}</title>
      </Head>
      <Preview>{t("subject")}</Preview>
      <Body
        style={{
          backgroundColor: theme.background,
          fontFamily: font,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container style={{ maxWidth: 600 }}>
          <Section style={{ textAlign: "center", paddingBottom: 16 }}>
            <Img
              src={logoUrl}
              alt="BeltaCourses"
              width={150}
              style={{ margin: "0 auto" }}
            />
          </Section>
          <Section
            style={{
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: "24px 32px",
              textAlign: align,
              color: theme.foreground,
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            {children}
            <Text style={{ margin: "24px 0 0" }}>
              {common("regards")}
              <br />
              {common("team")}
            </Text>
          </Section>
          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: theme.muted,
            }}
          >
            {common("footer")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
