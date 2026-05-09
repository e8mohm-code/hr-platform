import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow the dev server to accept requests from the local network IP so
  // server actions work when the browser hits 192.168.x.x instead of localhost.
  allowedDevOrigins: ['192.168.0.155', 'localhost', '127.0.0.1'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
