/**
 * Email clients ignore CSS variables, so the tokens are copied here as literal
 * values. Keep them in step with `:root` in `@repo/frontend/styles/theme.css`.
 */
export const theme = {
  primary: "#653899",
  primaryForeground: "#fafafa",
  foreground: "#1c162c",
  muted: "#737373",
  background: "#f4f1f8",
  card: "#ffffff",
  border: "#e5e5e5",
} as const;
