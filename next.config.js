let withNextOnPages = (config) => config;

// 仅在非测试环境加载 @cloudflare/next-on-pages（避免 Jest require 错误）
if (process.env.NODE_ENV !== 'test') {
  try {
    withNextOnPages = require('@cloudflare/next-on-pages');
  } catch (e) {
    console.warn('@cloudflare/next-on-pages not available, using plain Next.js config');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用压缩（gzip/brotli）
  compress: true,

  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  // 设置静态资源缓存头
  async headers() {
    return [
      // 静态资源缓存
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 安全头：所有路由
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ]
  },
}

module.exports = withNextOnPages(nextConfig)