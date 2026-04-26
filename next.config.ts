import type { NextConfig } from "next";
import withPWA from "next-pwa";

// Core Next.js configuration
const nextConfig: NextConfig = {
  // Enable strict mode for development to catch common issues
  reactStrictMode: true,
  // Use Turbopack for faster builds (Next.js 16+ feature)
  turbopack: {},
};

// PWA configuration with enhanced failsafes
export default withPWA({
  // Output directory for generated PWA files (manifest, icons, etc.)
  dest: "public",
  // Manually register in PWARegister component for better control
  // This allows us to add offline detection and file existence checks
  register: false,
  // Don't automatically skip waiting service workers
  // This prevents unexpected page reloads that interrupt user work
  skipWaiting: false,
  // Service worker file name to generate and register
  sw: "sw.js",
})(nextConfig);
