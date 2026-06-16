import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryPathname = cloudinaryCloudName ? `/${cloudinaryCloudName}/**` : '/**';

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
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: cloudinaryPathname,
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
  async rewrites() {
    if (isDev) {
      return [
        {
          source: '/uploads/:path*',
          destination: 'http://localhost:3001/uploads/:path*',
        },
      ];
    }
    // In production, we'll use ekama.onrender.com directly via getImageUrl,
    // which already uses PROD_API_URL in production mode
    return [];
  },
};

export default nextConfig;
