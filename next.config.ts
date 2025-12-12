import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: 'standalone',
  
  // Optimize images for Docker
  images: {
    domains: ['localhost', 'sinergia.digitalasiasolusindo.com', 'sinergiadev.digitalasiasolusindo.com'],
    unoptimized: false,
  },

  // Configure for Docker environment
  env: {
    HOSTNAME: '0.0.0.0',
    PORT: '3000',
    NEXT_PUBLIC_ERP_BASE_URL: process.env.ERP_BASE_URL,
  },

  // Enable compression
  compress: true,

  // Configure headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Configure rewrites for health check
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },

  // Experimental features for Docker
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost'],
    },
  },
};

export default nextConfig;
