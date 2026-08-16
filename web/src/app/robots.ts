import type { MetadataRoute } from "next";

const BASE_URL = "https://mestroo-two.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/kyc",
        "/home",
        "/dashboard",
        "/admin",
        "/chat",
        "/company",
        "/map",
        "/notifications",
        "/onboarding",
        "/prestador",
        "/privacy",
        "/profile",
        "/search",
        "/security",
        "/services",
        "/settings",
        "/terms",
        "/transactions",
        "/wallet",
        "/provider",
        "/provider-home",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}