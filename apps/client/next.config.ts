import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The request config — locales, messages, time zone — lives in @repo/frontend.
const withNextIntl = createNextIntlPlugin(
  "../../packages/frontend/common/src/i18n/request.ts",
);

// Images live on the files app; next/image refuses remote hosts that are not listed.
const staticImages = process.env.NEXT_PUBLIC_STATIC_IMAGES_URL;
const staticImagesUrl = staticImages?.startsWith("http")
  ? new URL(staticImages)
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // The files app is on localhost in dev; Next blocks private IPs unless told otherwise.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: staticImagesUrl
      ? [
          {
            protocol: staticImagesUrl.protocol.replace(":", "") as
              | "http"
              | "https",
            hostname: staticImagesUrl.hostname,
            port: staticImagesUrl.port,
          },
        ]
      : [],
  },
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@repo/frontend", "@repo/frontend-features"],
};

export default withNextIntl(nextConfig);
