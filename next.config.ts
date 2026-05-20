import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['dev.scam.software'],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
