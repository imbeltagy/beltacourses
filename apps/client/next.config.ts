import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@repo/frontend", "@repo/frontend-libs"],
};

export default nextConfig;
