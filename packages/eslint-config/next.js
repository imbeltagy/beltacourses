import pluginNext from "@next/eslint-plugin-next";
import { config as reactConfig } from "./react.js";

/**
 * Next.js apps and the frontend packages they transpile: the React config plus
 * Next's own rules and Core Web Vitals checks.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...reactConfig,
  {
    plugins: { "@next/next": pluginNext },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
];
