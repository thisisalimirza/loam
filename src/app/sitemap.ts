import { MetadataRoute } from "next";
import { getAllContent } from "@/lib/getAllContent";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const allContent = getAllContent().filter(c => c.published);
  const { sections } = getSiteStructure();

  const home: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Section index pages (e.g. /essays, /memos)
  const sectionPages: MetadataRoute.Sitemap = sections.map(section => ({
    url: `${baseUrl}/${section.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Individual content pages
  const contentPages: MetadataRoute.Sitemap = allContent.map(item => ({
    url: `${baseUrl}${item.url}`,
    lastModified: item.date ? new Date(item.date) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...home, ...sectionPages, ...contentPages];
}
