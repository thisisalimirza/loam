export const dynamic = "force-dynamic";
import { getAllContent } from "@/lib/getAllContent";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { siteConfig } from "@/config/site";
import { NextResponse } from "next/server";

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

function formatEntry(entry: UrlEntry): string {
  return [
    `  <url>`,
    `    <loc>${entry.loc}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : "",
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
    entry.priority ? `    <priority>${entry.priority}</priority>` : "",
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function GET() {
  const siteUrl = siteConfig.url;
  const today = new Date().toISOString().split("T")[0];
  const allContent = getAllContent().filter((item) => item.published !== false);
  const { sections, topLevelPages } = getSiteStructure();

  const entries: UrlEntry[] = [
    { loc: siteUrl, lastmod: today, changefreq: "weekly", priority: "1.0" },
    ...sections
      .filter((s) => s.pages.some((p) => p.published !== false))
      .map((s) => ({
        loc: `${siteUrl}/${s.slug}`,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.8",
      })),
    ...allContent.map((item) => ({
      loc: `${siteUrl}${item.url}`,
      lastmod: item.date ? new Date(item.date).toISOString().split("T")[0] : today,
      changefreq: "monthly",
      priority: "0.6",
    })),
    ...topLevelPages
      .filter((p) => p.published !== false)
      .map((p) => ({
        loc: `${siteUrl}/${p.slug}`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.7",
      })),
  ];

  // Deduplicate by loc
  const seen = new Set<string>();
  const unique = entries.filter((e) => {
    if (seen.has(e.loc)) return false;
    seen.add(e.loc);
    return true;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map(formatEntry).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
