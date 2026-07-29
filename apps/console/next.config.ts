import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@scout/core"],
  turbopack: {
    root: path.join(import.meta.dirname, "../.."),
  },
};

export default nextConfig;
