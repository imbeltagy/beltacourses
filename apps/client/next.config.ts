import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The request config — locales, messages, time zone — lives in @repo/frontend.
const withNextIntl = createNextIntlPlugin(
  "../../packages/frontend/common/src/i18n/request.ts",
);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@repo/frontend", "@repo/frontend-features"],
};

export default withNextIntl(nextConfig);
