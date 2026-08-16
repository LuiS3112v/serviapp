import type { MetadataRoute } from "next";

const BASE_URL = "https://mestroo-two.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, freq: "weekly" as const },
    { path: "/sobre", priority: 0.7, freq: "monthly" as const },
    { path: "/termos", priority: 0.3, freq: "yearly" as const },
    { path: "/privacidade", priority: 0.3, freq: "yearly" as const },
    { path: "/login", priority: 0.5, freq: "monthly" as const },
    { path: "/register/client", priority: 0.6, freq: "monthly" as const },
    { path: "/register/provider", priority: 0.6, freq: "monthly" as const },
  ];

  return routes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}