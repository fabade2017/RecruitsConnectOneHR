/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Local dev proxy; in Vercel prod, NEXT_PUBLIC_API_URL points to hosted API
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
    return [{ source: '/api/:path*', destination: `${api}/:path*` }];
  },
};
module.exports = nextConfig;
