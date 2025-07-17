import fs from "fs";
import matter from "gray-matter";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { getAllContent } from "@/lib/getAllContent";
import readingTime from "reading-time";
import HomePage from "@/app/components/HomePage";
import SectionPage from "@/app/components/SectionPage";
import ArticlePage from "@/app/components/ArticlePage";
import TopLevelPage from "@/app/components/TopLevelPage";
import ErrorPage from "@/app/components/ErrorPage";
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

export default async function CatchAllPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const slugArr = slug || [];
  const { sections, topLevelPages } = getSiteStructure();

  // Homepage
  if (slugArr.length === 0) {
    const allContent = getAllContent();
    const recent = allContent
      .filter(item => item.published !== false && item.date)
      .sort((a, b) => (b.date! > a.date! ? 1 : -1))
      .slice(0, 2);
    return <HomePage recent={recent} />;
  }

  // Top-level .mdx page
  if (slugArr.length === 1) {
    const page = topLevelPages.find(p => p.slug === slugArr[0] && p.published !== false);
    if (page) {
      try {
        const file = fs.readFileSync(page.filePath, "utf8");
        const { content, data } = matter(file);
        const canonicalUrl = `/${page.slug}`;
        return (
          <TopLevelPage
            content={content}
            data={data}
            canonicalUrl={canonicalUrl}
            slug={page.slug}
          />
        );
      } catch (err) {
        return (
          <ErrorPage
            message="Error rendering page"
            error={err as Error}
            type="error"
          />
        );
      }
    }
    
    // Section list page
    const section = sections.find(s => s.slug === slugArr[0]);
    if (section) {
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
    
    // Not found
    return <ErrorPage message="Page not found" type="not-found" />;
  }

  // Section content page
  if (slugArr.length === 2) {
    const [sectionSlug, pageSlug] = slugArr;
    const section = sections.find(s => s.slug === sectionSlug);
    const page = section?.pages.find(p => p.slug === pageSlug && p.published !== false);
    if (page) {
      try {
        const file = fs.readFileSync(page.filePath, "utf8");
        const { content, data } = matter(file);
        const stats = fs.statSync(page.filePath);
        const publishedDate = data.date || (stats.birthtime && stats.birthtime.getFullYear() > 2000
          ? stats.birthtime.toISOString().slice(0, 10)
          : stats.mtime.toISOString().slice(0, 10));
        const lastEditedDate = data.lastEdited || stats.mtime.toISOString().slice(0, 10);
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
            e.slug !== pageSlug
          ).slice(0, 3);
        }
        
        const canonicalUrl = `/${sectionSlug}/${page.slug}`;
        return (
          <ArticlePage
            content={contentWithAnchors}
            data={data}
            headings={headings}
            related={related}
            publishedDate={publishedDate}
            lastEditedDate={lastEditedDate}
            readTime={readTime}
            canonicalUrl={canonicalUrl}
            sectionName={section?.name}
            sectionSlug={sectionSlug}
          />
        );
      } catch (err) {
        return (
          <ErrorPage
            message="Error rendering article"
            error={err as Error}
            type="error"
          />
        );
      }
    }
    
    // Not found
    return <ErrorPage message="Page not found" type="not-found" />;
  }

  // Not found (too many segments)
  return <ErrorPage message="Page not found" type="not-found" />;
}