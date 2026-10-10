"use client";

import { useLocale } from "next-intl";
import { ThemeProvider } from "next-themes";

import { getDirection } from "../../i18n/routing";
import { Toaster } from "../../ui/sonner";

export function AppTheme({ children }: { children: React.ReactNode }) {
  const dir = getDirection(useLocale());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      {/* The corner mirrors with the page: top-end, not always top-right. */}
      <Toaster
        dir={dir}
        position={dir === "rtl" ? "top-left" : "top-right"}
        richColors
      />
    </ThemeProvider>
  );
}
