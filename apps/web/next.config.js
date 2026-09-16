/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vladmandic/face-api'],
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    return config;
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    const chatbotApi = process.env.NEXT_PUBLIC_CHATBOT_API || 'https://customer-service-agent-sr5j.onrender.com';
    return [
      { source: '/cs/:path*', destination: `${chatbotApi}/:path*` },
      { source: '/api/:path*', destination: `${api}/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.dicebear.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https://recruits-connect-one-hr-api.onrender.com https://customer-service-agent-sr5j.onrender.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
