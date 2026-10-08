import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * Plain Node code with no framework: scripts, Prisma tooling, config files.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  {
    languageOptions: { globals: globals.node },
  },
];
