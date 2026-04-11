import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-19f678b6a57845a7bafc5e706541ab76.r2.dev",
        pathname: "/photos/**",
      },
    ],
  },
};

export default nextConfig;
