import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/app/pillars',
        destination: '/app/areas',
        permanent: true,
      },
      {
        source: '/app/pillars/new',
        destination: '/app/areas/new',
        permanent: true,
      },
      {
        source: '/app/pillars/:id',
        destination: '/app/areas/:id',
        permanent: true,
      },
      {
        source: '/app/pillars/:id/edit',
        destination: '/app/areas/:id/edit',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
