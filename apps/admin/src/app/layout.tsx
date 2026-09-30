import type { Metadata } from "next";
import { fontVariables } from "@repo/frontend/fonts";
import { AppTheme } from "@repo/frontend/theme/app-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeltaCourses Admin",
  description: "Staff control panel for BeltaCourses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AppTheme>{children}</AppTheme>
      </body>
    </html>
  );
}
