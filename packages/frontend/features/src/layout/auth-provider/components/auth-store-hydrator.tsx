"use client";

import { useState, type ReactNode } from "react";
import { useAuthStore } from "@repo/frontend/utils/auth-store";

/**
 * Seeds the store once, during the first render, so children's effects and
 * fetches already see the token. Later server re-renders (`router.refresh`)
 * must not overwrite it: the in-memory token may be fresher after a refresh.
 */
export function AuthStoreHydrator({
  accessToken,
  children,
}: {
  accessToken: string | undefined;
  children: ReactNode;
}) {
  useState(() => {
    useAuthStore.setState({ accessToken });
  });

  return children;
}
