import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimiert für Docker/Coolify Deployment
  output: 'standalone',
  
  // Einfache Image-Konfiguration für Container
  images: {
    unoptimized: true,
  },
  
  // Port-Konfiguration für Container
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
