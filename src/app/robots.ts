import { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The editor and the routes behind it are of no use to a crawler.
      disallow: ["/admin", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}
