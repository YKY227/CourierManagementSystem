/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3001";
    return [
      // Only proxy our backend tunnel
      { source: "/api/backend/:path*", destination: `${backend}/:path*` },
    ];
  },
};

module.exports = nextConfig;
