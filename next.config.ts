import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native Node drivers out of the webpack bundle (fixes pg load failures in dev).
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "better-sqlite3"],
};

export default nextConfig;
