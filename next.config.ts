import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// PWA configuration — only in production to avoid GenerateSW loop in dev
const pwaConfig = process.env.NODE_ENV === "production"
  ? withPWA({
      dest: "public",
      register: false,
      skipWaiting: false,
      sw: "sw.js",
    })(nextConfig)
  : nextConfig;

export default pwaConfig;
