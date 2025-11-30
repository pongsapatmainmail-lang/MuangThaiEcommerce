/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone สำหรับ production
  output: 'standalone',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // Image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
    ],
    // ใช้ unoptimized สำหรับ static export ถ้าต้องการ
    // unoptimized: true,
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Trailing slash
  trailingSlash: false,
};

module.exports = nextConfig;