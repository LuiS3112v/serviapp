import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons"
    ]
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;