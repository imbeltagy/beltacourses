"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "../../ui/sonner";

export function AppTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
