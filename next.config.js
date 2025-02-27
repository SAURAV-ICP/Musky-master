/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
    domains: ['localhost', 'musky-mini-app.vercel.app'],
  },
  // Configuration for Telegram Mini App
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org https://*.telegram.org; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ton.org https://*.ton.org https://telegram.org https://*.telegram.org; img-src 'self' blob: data: https://*.supabase.co https://telegram.org https://*.telegram.org; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://telegram.org https://*.telegram.org;"
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://telegram.org/'
          }
        ]
      }
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|webp)$/i,
      type: 'asset/resource'
    })
    return config
  }
}

module.exports = nextConfig 