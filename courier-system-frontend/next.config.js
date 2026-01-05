/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend =
      process.env.BACKEND_INTERNAL_URL ||
      "https://couriermanagementsystem-production-0c9f.up.railway.app";

    return [{ source: "/api/backend/:path*", destination: `${backend}/:path*` }];
  },
};

module.exports = nextConfig;
