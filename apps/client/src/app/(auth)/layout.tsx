import { AuthLayout } from "@repo/frontend/layout/auth-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
