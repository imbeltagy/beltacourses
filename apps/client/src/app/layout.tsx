import type { Metadata } from "next";
import { fontVariables } from "@repo/frontend/fonts";
import { AppTheme } from "@repo/frontend/theme/app-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeltaCourses",
  description: "BeltaCourses — learn online.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AppTheme>{children}</AppTheme>
      </body>
    </html>
  );
}
