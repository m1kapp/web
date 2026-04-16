import type { MetadataRoute } from "next";
import { appHost } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `https://${appHost()}/sitemap.xml`,
  };
}
