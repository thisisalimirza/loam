import fs from "fs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { getAllContent } from "@/lib/getAllContent";
import { buildMetadata, excerpt } from "@/lib/seo";
import readingTime from "reading-time";
import HomePage from "@/app/components/HomePage";
import SectionPage from "@/app/components/SectionPage";
import ArticlePage from "@/app/components/ArticlePage";
import TopLevelPage from "@/app/components/TopLevelPage";
import ErrorPage from "@/app/components/ErrorPage";
import { siteConfig } from "@/config/site";
import { PageParams, ContentItem } from "@/types";

function extractHeadings(markdown: string) {
  const headingRegex = /^(##+)\s+(.*)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(markdown))) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    });
  }
  return headings;
}

function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Prerender every content URL. Without this the whole archive is rendered on
 * demand, which costs a round trip on the first crawl of each page.
 */
export function generateStaticParams() {
  const { sections, topLevelPages } = getSiteStructure();

  return [
    ...topLevelPages
      .filter(page => page.published !== false)
      .map(page => ({ slug: [page.slug] })),
    ...sections.map(section => ({ slug: [section.slug] })),
    ...sections.flatMap(section =>
      section.pages
        .filter(page => page.published !== false)
        .map(page => ({ slug: [section.slug, page.slug] }))
    ),
  ];
}

/** Reads a content file and resolves the fields metadata and rendering share. */
function loadPage(slugArr: string[]) {
  const { sections, topLevelPages } = getSiteStructure();

  if (slugArr.length === 1) {
    const page = topLevelPages.find(p => p.slug === slugArr[0] && p.published !== false);
    if (page) return { kind: "page" as const, page };

    const section = sections.find(s => s.slug === slugArr[0]);
    if (section) return { kind: "section" as const, section };
  }

  if (slugArr.length === 2) {
    const [sectionSlug, pageSlug] = slugArr;
    const section = sections.find(s => s.slug === sectionSlug);
    const page = section?.pages.find(p => p.slug === pageSlug && p.published !== false);
    if (section && page) return { kind: "article" as const, section, page };
  }

  return { kind: "missing" as const };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugArr = slug || [];

  if (slugArr.length === 0) {
    return buildMetadata({
      title: `${siteConfig.author.name} — Essays on Medicine, Technology and What Lasts`,
      absoluteTitle: true,
      description: siteConfig.description,
      path: "/",
      ogEyebrow: "Essays · Book notes · Meditations",
    });
  }

  const found = loadPage(slugArr);

  if (found.kind === "missing") {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  if (found.kind === "section") {
    const { section } = found;
    const count = section.pages.filter(p => p.published !== false).length;
    return buildMetadata({
      title: section.name,
      description: `${count} ${count === 1 ? "piece" : "pieces"} of writing filed under ${section.name.toLowerCase()} by ${siteConfig.author.name}.`,
      path: `/${section.slug}`,
      ogEyebrow: "Section",
      ogMeta: `${count} ${count === 1 ? "piece" : "pieces"}`,
    });
  }

  const { page } = found;
  const isArticle = found.kind === "article";
  const path = isArticle ? `/${found.section.slug}/${page.slug}` : `/${page.slug}`;

  let data: Record<string, unknown> = {};
  let body = "";
  try {
    const parsed = matter(fs.readFileSync(page.filePath, "utf8"));
    data = parsed.data;
    body = parsed.content;
  } catch {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const title = typeof data.title === "string" && data.title ? data.title : titleCase(page.slug);
  const summary = typeof data.summary === "string" && data.summary ? data.summary : "";

  return buildMetadata({
    title,
    // A good half of the archive predates the `summary` field, so fall back to
    // the opening prose rather than repeating the site-wide description.
    description: summary || excerpt(body),
    path,
    type: "article",
    publishedTime: typeof data.date === "string" ? data.date : undefined,
    modifiedTime: typeof data.lastEdited === "string" ? data.lastEdited : undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    ogEyebrow: isArticle ? found.section.name : siteConfig.name,
    ogMeta: typeof data.date === "string" ? data.date : undefined,
  });
}

export default async function CatchAllPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const slugArr = slug || [];

  // Homepage
  if (slugArr.length === 0) {
    return <HomePage />;
  }

  const found = loadPage(slugArr);

  // Top-level .mdx page
  if (found.kind === "page") {
    const { page } = found;
    try {
      const file = fs.readFileSync(page.filePath, "utf8");
      const { content, data } = matter(file);
      return (
        <TopLevelPage
          content={content}
          data={data}
          canonicalUrl={`/${page.slug}`}
          slug={page.slug}
        />
      );
    } catch (err) {
      return <ErrorPage message="Error rendering page" error={err as Error} type="error" />;
    }
  }

  // Section list page
  if (found.kind === "section") {
    const { section } = found;
    const allContent = getAllContent();
    const sectionItems = allContent
      .filter(item => item.published !== false && item.section === section.slug)
      .map(item => {
        let effectiveDate = item.date;
        if (!effectiveDate && item.filePath) {
          try {
            const stats = fs.statSync(item.filePath);
            effectiveDate = stats.birthtime.toISOString().slice(0, 10);
          } catch {}
        }
        return { ...item, effectiveDate };
      })
      .sort((a, b) => (b.effectiveDate && a.effectiveDate && b.effectiveDate > a.effectiveDate ? 1 : -1));
    return <SectionPage section={section} items={sectionItems} />;
  }

  // Section content page
  if (found.kind === "article") {
    const { section, page } = found;
    const sectionSlug = section.slug;
    try {
      const file = fs.readFileSync(page.filePath, "utf8");
      const { content, data } = matter(file);
      const publishedDate = data.date as string | undefined;
      const lastEditedDate = data.lastEdited as string | undefined;
      const readTime = readingTime(content).text;
      const headings = extractHeadings(content);

      // Add IDs to headings in content for anchor links
      let contentWithAnchors = content;
      for (const h of headings) {
        const regex = new RegExp(`^(#{${h.level}}\\s+)${h.text.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'm');
        contentWithAnchors = contentWithAnchors.replace(regex, `$1<a id="${h.id}"></a>${h.text}`);
      }

      // Related content by tag
      const allContent = getAllContent();
      let related: ContentItem[] = [];
      if (data.tags && Array.isArray(data.tags)) {
        related = allContent.filter(e =>
          e.published !== false &&
          e.section === sectionSlug &&
          Array.isArray(e.tags) && e.tags.some((tag: string) => data.tags.includes(tag)) &&
          e.slug !== page.slug
        ).slice(0, 3);
      }

      return (
        <ArticlePage
          content={contentWithAnchors}
          data={data}
          headings={headings}
          related={related}
          publishedDate={publishedDate}
          lastEditedDate={lastEditedDate}
          readTime={readTime}
          canonicalUrl={`/${sectionSlug}/${page.slug}`}
          sectionName={section.name}
          sectionSlug={sectionSlug}
        />
      );
    } catch (err) {
      return <ErrorPage message="Error rendering article" error={err as Error} type="error" />;
    }
  }

  // Nothing matched — return a real 404 rather than a 200 with "404" in the body.
  notFound();
}
