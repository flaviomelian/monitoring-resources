import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Eliminamos output: 'export'
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://despacho-desktop-3basi77.tail645042.ts.net:8081/api/:path*",
      },
    ];
  },
};

export default nextConfig;