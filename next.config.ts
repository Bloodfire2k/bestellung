import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimiert für Coolify Deployment
  images: {
    unoptimized: true,
  },
  
  // Container-freundliche Konfiguration
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
