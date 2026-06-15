import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lovable.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ekama.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
    localPatterns: [
      {
        pathname: '/images/**',
      },
      {
        pathname: '/uploads/**',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
