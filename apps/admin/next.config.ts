import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@repo/frontend", "@repo/frontend-features"],
};

export default nextConfig;
