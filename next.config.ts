import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oikubhlwdbxrfhifqusn.supabase.co', // 換成你的 Supabase 域名
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // 這是為了顯示 Google 登入的頭像
      }
    ],
  },
};

export default nextConfig;