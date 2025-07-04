import { getAllContent } from "@/lib/getAllContent";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { NextResponse } from "next/server";

export async function GET() {
  const siteUrl = "https://alimirza.com"; // Change to your actual domain if needed
  const allContent = getAllContent().filter(item => item.published !== false);
  const { sections, topLevelPages } = getSiteStructure();

  let urls = [
    siteUrl,
    ...sections
      .filter(s => s.pages.some(p => p.published !== false))
      .map(s => `${siteUrl}/${s.slug}`),
    ...allContent.map(item => `${siteUrl}${item.url}`),
    ...topLevelPages.filter(p => p.published !== false).map(p => `${siteUrl}/${p.slug}`)
  ];
  // Remove duplicates
  urls = Array.from(new Set(urls));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      url => `<url><loc>${url}</loc></url>`
    )
    .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
} 