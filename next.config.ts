import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mssql", "tedious"],
  allowedDevOrigins: ["192.168.70.102"],
  experimental: {
    serverActions: {
      allowedOrigins: ["food.digifair.ir"],
    },
  },
};

export default nextConfig;
