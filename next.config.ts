import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mhaedzsjmcxamzroaede.supabase.co",
      },
    ],
  },
};

export default nextConfig;
