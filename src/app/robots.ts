import { nextRobots } from "@m1kapp/kit/seo";
import { appHost } from "@/lib/utils";

export default function robots() {
  return nextRobots({ sitemap: `https://${appHost()}/sitemap.xml` });
}
