import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/merchant/team",
        destination: "/merchant/stores",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
