import { MetadataRoute } from "next";
import { getAllContent } from "@/lib/getAllContent";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { getAllTags } from "@/lib/getAllTags";
import { getReading } from "@/lib/getReading";
import { getIndexableSources } from "@/lib/readingSeo";
import { absoluteUrl } from "@/lib/seo";

/** Tag pages below this count are noindex; keeping them out of the sitemap agrees with that. */
const MIN_TAG_ENTRIES = 3;

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const allContent = getAllContent().filter(c => c.published !== false);
  const { sections, topLevelPages } = getSiteStructure();
  const { generatedAt } = getReading();
  const readingUpdated = toDate(generatedAt);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },

    // The two hubs everything else hangs off.
    { url: absoluteUrl("/writing"), changeFrequency: "weekly", priority: 0.9 },
    {
      url: absoluteUrl("/reading"),
      lastModified: readingUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: absoluteUrl("/future"), changeFrequency: "monthly", priority: 0.6 },

    // Section indexes (/essays, /memos, …)
    ...sections.map(section => ({
      url: absoluteUrl(`/${section.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),

    // Standalone pages (/about, /start-here, …)
    ...topLevelPages
      .filter(page => page.published !== false)
      .map(page => ({
        url: absoluteUrl(`/${page.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),

    // Every published essay, memo, vignette and note.
    ...allContent.map(item => ({
      url: absoluteUrl(item.url),
      lastModified: toDate(item.lastEdited) ?? toDate(item.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    // Book and source pages — the largest body of pages on the site, and the
    // way most people find their way in. Duplicates and stubs are left out.
    ...getIndexableSources().map(source => ({
      url: absoluteUrl(`/reading/${source.slug}`),
      lastModified: toDate(source.lastHighlightedAt) ?? readingUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    // Topic hubs with enough behind them to be worth crawling.
    ...getAllTags()
      .filter(({ count }) => count >= MIN_TAG_ENTRIES)
      .map(({ tag }) => ({
        url: absoluteUrl(`/tag/${encodeURIComponent(tag)}`),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
  ];

  const seen = new Set<string>();
  return entries.filter(entry => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
