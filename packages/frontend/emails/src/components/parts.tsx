import { Button, Heading, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { theme } from "../theme.ts";

export function Title({ children }: { children: ReactNode }) {
  return (
    <Heading as="h2" style={{ margin: "0 0 16px", fontSize: 22 }}>
      {children}
    </Heading>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={{ margin: "0 0 16px" }}>{children}</Text>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <Text style={{ margin: "16px 0 0", fontSize: 13, color: theme.muted }}>
      {children}
    </Text>
  );
}

export function Action({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: theme.primary,
        color: theme.primaryForeground,
        borderRadius: 8,
        padding: "12px 28px",
        fontSize: 15,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
