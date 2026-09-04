import type { MetadataRoute } from "next";
import { seoCities } from "@/lib/seoCities";

const APP_URL = "https://coflowapp.es";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/comunidades`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/companeros-de-piso`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/para-propietarios`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...seoCities.map((city) => ({
      url: `${APP_URL}/companeros-de-piso/${city.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
