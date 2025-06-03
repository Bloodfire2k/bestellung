import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ultra-minimal config für Server mit wenig Memory
  output: 'standalone',
  
  // Keine Optimierungen die Memory verbrauchen
  images: {
    unoptimized: true,
  },
  
  // Reduzierte Build-Features
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
