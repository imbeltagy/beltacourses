import globals from "globals";
import tseslint from "typescript-eslint";
import { config as baseConfig } from "./base.js";

/**
 * NestJS apps and the provider packages they consume. Type-aware, so it needs
 * the project's own directory to find its tsconfig:
 *
 *   export default createConfig({ tsconfigRootDir: import.meta.dirname });
 *
 * Deliberately no `consistent-type-imports`: Nest's DI reads constructor
 * parameter types from `emitDecoratorMetadata`, which a type-only import erases.
 *
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import("eslint").Linter.Config[]}
 */
export function createConfig({ tsconfigRootDir }) {
  return tseslint.config(
    ...baseConfig,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: { ...globals.node, ...globals.jest },
        parserOptions: { projectService: true, tsconfigRootDir },
      },
    },
    {
      rules: {
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/require-await": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unnecessary-type-assertion": "warn",
        "@typescript-eslint/only-throw-error": "error",
      },
    },
    {
      // Config files sit outside the tsconfig, so they cannot be type-checked.
      files: ["**/*.{js,mjs,cjs}"],
      extends: [tseslint.configs.disableTypeChecked],
      languageOptions: { globals: globals.node },
      // Tooling configs (webpack, jest) are CommonJS.
      rules: { "@typescript-eslint/no-require-imports": "off" },
    },
    {
      // Specs mock freely: jest.fn() and expect.any() are typed `any`.
      files: ["**/*.spec.ts", "**/*.integration-spec.ts", "test/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "no-console": "off",
      },
    },
  );
}
