import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * React rules for browser code: the base config, plus React, the rules of
 * hooks and accessibility. Used directly by the frontend packages and extended
 * by `next`.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    settings: { react: { version: "detect" } },
  },
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { "react-hooks": pluginReactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // React scope is not needed with the automatic JSX runtime, and
      // TypeScript replaces prop-types.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-key": ["error", { checkFragmentShorthand: true }],
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
      "react/jsx-no-target-blank": "error",
      "react/self-closing-comp": "warn",
      "react/no-array-index-key": "warn",
      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" },
      ],
    },
  },
];
