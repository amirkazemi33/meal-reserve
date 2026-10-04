import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ['192.168.70.102'],
  outputFileTracingIncludes: {
    "/*": ["node_modules/better-sqlite3/**/*"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["food.digifair.ir"],
    },
  },
};

export default nextConfig;
