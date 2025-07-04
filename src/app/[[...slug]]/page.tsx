import fs from "fs";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import BreadcrumbsServer from "@/app/components/BreadcrumbsServer";
import Footer from "@/app/components/Footer";
import { getSiteStructure } from "@/lib/getSiteStructure";
import { getAllContent } from "@/lib/getAllContent";
import readingTime from "reading-time";
import Head from "next/head";

function extractHeadings(markdown: string) {
  // Only h2/h3 for TOC
  const headingRegex = /^(##+)\s+(.*)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(markdown))) {
    headings.push({
      level: match[1].length, // 2 for h2, 3 for h3
      text: match[2],
      id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    });
  }
  return headings;
}

export default async function CatchAllPage({ params }: { params: { slug?: string[] } }) {
  const { slug } = params;
  const slugArr = slug || [];
  const { sections, topLevelPages } = getSiteStructure();

  // Homepage
  if (slugArr.length === 0) {
    const allContent = getAllContent();
    const recent = allContent
      .filter(item => item.published !== false && item.date)
      .sort((a, b) => (b.date! > a.date! ? 1 : -1))
      .slice(0, 2);
    return (
      <div
        style={{
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-geist-sans, Georgia, serif)"
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", width: "100%", padding: "0 1rem" }}>
          <BreadcrumbsServer />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 1rem" }}>
          <div style={{ maxWidth: 700, width: "100%" }}>
            <header style={{ marginBottom: "2.5rem", textAlign: "center" }}>
              <img
                src="/profilepic.jpg"
                alt="Ali Mirza profile photo"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: "50%",
                  display: "block",
                  margin: "0 auto 1.5rem auto",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
                }}
              />
              <h1 style={{ fontWeight: 700, fontSize: "2.5rem", marginBottom: "0.5rem" }}>Hi, I&apos;m Ali.</h1>
              <p style={{ fontSize: "1.2rem", color: "#444", marginBottom: "1.5rem" }}>
                This is a Library of my Mind.
                <br />
                You can visit, wander, and take something—even if you only stay for 5 minutes.
              </p>
              <blockquote style={{ fontStyle: "italic", color: "#888", borderLeft: "3px solid #eee", paddingLeft: 12 }}>
                &quot;I write to think. To remember. To challenge. To understand.&quot;
              </blockquote>
            </header>
            <section style={{ marginBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 8 }}>Recently Added</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recent.map(item => (
                  <li key={item.url} style={{ marginBottom: 18, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                    <Link href={item.url} style={{ fontWeight: 600, fontSize: "1.08rem" }}>{item.title}</Link>
                    <span style={{ color: "#aaa", fontSize: "0.97rem", marginLeft: 8 }}>
                      {item.section.charAt(0).toUpperCase() + item.section.slice(1)}
                      {item.date && <> · {item.date}</>}
                      {item.readTime && <> · {item.readTime}</>}
                    </span>
                    {item.summary && <div style={{ color: "#666", fontSize: "0.98rem", marginTop: 2 }}>{item.summary}</div>}
                  </li>
                ))}
              </ul>
            </section>
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  // Top-level .mdx page
  if (slugArr.length === 1) {
    const page = topLevelPages.find(p => p.slug === slugArr[0] && p.published !== false);
    if (page) {
      try {
        const file = fs.readFileSync(page.filePath, "utf8");
        const { content, data } = matter(file);
        const canonicalUrl = `https://alimirza.com/${page.slug}`;
        return (
          <>
            <Head>
              <title>{data.title || page.slug} – Ali Mirza</title>
              <meta name="description" content={data.summary || "Essays, meditations, memos, vignettes, and projects by Ali Mirza."} />
              <meta property="og:title" content={`${data.title || page.slug} – Ali Mirza`} />
              <meta property="og:description" content={data.summary || "Essays, meditations, memos, vignettes, and projects by Ali Mirza."} />
              <meta property="og:type" content="article" />
              <meta property="og:url" content={canonicalUrl} />
              <meta property="og:site_name" content="Ali Mirza" />
              <meta name="twitter:card" content="summary" />
              <meta name="twitter:title" content={`${data.title || page.slug} – Ali Mirza`} />
              <meta name="twitter:description" content={data.summary || "Essays, meditations, memos, vignettes, and projects by Ali Mirza."} />
              <link rel="canonical" href={canonicalUrl} />
            </Head>
            <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem", fontFamily: "var(--font-geist-sans, Georgia, serif)" }}>
              <BreadcrumbsServer />
              <header style={{ marginBottom: "2.5rem", textAlign: "center" }}>
                <h1 style={{ fontWeight: 700, fontSize: "2.2rem", marginBottom: "0.5rem" }}>{data.title || page.slug}</h1>
                <div style={{ color: "#888", fontSize: "1.05rem", margin: "0.5rem 0 1.2rem 0", lineHeight: 1.7 }}>
                  {data.date && <div>{data.date}</div>}
                  {data.readTime && <div>{data.readTime}</div>}
                </div>
                {data.summary && <blockquote style={{ color: "#888", fontStyle: "italic", margin: "0 0 1.2rem 0" }}>{data.summary}</blockquote>}
              </header>
              <div className="prose">
                <MDXRemote source={content} />
              </div>
              <Footer />
            </div>
          </>
        );
      } catch (err) {
        return <div style={{ padding: 40, textAlign: "center", color: "red" }}>Error rendering page: {String(err)}</div>;
      }
    }
    // Section list page
    const section = sections.find(s => s.slug === slugArr[0]);
    if (section) {
      // Use getAllContent to get all items in this section
      const allContent = getAllContent();
      // For each item, determine the effective date (frontmatter date or file creation date)
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
      return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem", fontFamily: "var(--font-geist-sans, Georgia, serif)" }}>
          <BreadcrumbsServer />
          <h1 style={{ fontWeight: 700, fontSize: "2rem", marginBottom: 12 }}>{section.name}</h1>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sectionItems.map(item => (
              <li key={item.url} style={{ marginBottom: 18, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                <Link href={item.url} style={{ fontWeight: 600, fontSize: "1.08rem" }}>{item.title}</Link>
                <span style={{ color: "#aaa", fontSize: "0.97rem", marginLeft: 8 }}>
                  {item.effectiveDate && <> · {item.effectiveDate}</>}
                  {item.readTime && <> · {item.readTime}</>}
                </span>
                {item.summary && <div style={{ color: "#666", fontSize: "0.98rem", marginTop: 2 }}>{item.summary}</div>}
              </li>
            ))}
          </ul>
          <Footer />
        </div>
      );
    }
    // Not found
    return <div style={{ padding: 40, textAlign: "center" }}>404 – Page not found</div>;
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
        const publishedDate = data.date || stats.birthtime.toISOString().slice(0, 10);
        const lastEditedDate = stats.mtime.toISOString().slice(0, 10);
        // Always calculate reading time
        const readTime = readingTime(content).text;
        // TOC
        const headings = extractHeadings(content);
        // Add IDs to headings in content for anchor links
        let contentWithAnchors = content;
        for (const h of headings) {
          const regex = new RegExp(`^(#{${h.level}}\\s+)${h.text.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'm');
          contentWithAnchors = contentWithAnchors.replace(regex, `$1<a id=\"${h.id}\"></a>${h.text}`);
        }
        // Related essays by tag
        const allContent = getAllContent();
        let related: import("@/lib/getAllContent").ContentItem[] = [];
        if (data.tags && Array.isArray(data.tags)) {
          related = allContent.filter(e =>
            e.published !== false &&
            e.section === sectionSlug &&
            Array.isArray(e.tags) && e.tags.some((tag: string) => data.tags.includes(tag)) &&
            e.slug !== pageSlug
          ).slice(0, 3);
        }
        const canonicalUrl = `https://alimirza.com/${sectionSlug}/${page.slug}`;
        return (
          <>
            <Head>
              <title>{data.title || page.slug} – Ali Mirza</title>
              <meta name="description" content={data.summary || "Essays, meditations, memos, vignettes, and projects by Ali Mirza."} />
              <meta property="og:title" content={`${data.title || page.slug} – Ali Mirza`} />
              <meta property="og:description" content={data.summary || "Essays, meditations, memos, vignettes, and projects by Ali Mirza."} />
              <meta property="og:type" content="article" />
              <meta property="og:url" content={canonicalUrl} />
              <meta property="og:site_name" content="Ali Mirza" />
              <meta name="twitter:card" content="summary" />
              <meta name="twitter:title" content={`${data.title || page.slug} – Ali Mirza`} />
              <meta name="twitter:description" content={data.summary || "Essays, meditations, memos, vignettes, and projects by Ali Mirza."} />
              <link rel="canonical" href={canonicalUrl} />
            </Head>
            <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem 1rem", fontFamily: "var(--font-geist-sans, Georgia, serif)" }}>
              <BreadcrumbsServer />
              <h1 style={{ fontWeight: 700, fontSize: "2.2rem", marginBottom: 8 }}>{data.title || page.slug}</h1>
              {data.summary && <blockquote style={{ color: "#888", fontStyle: "italic", marginBottom: 24 }}>{data.summary}</blockquote>}
              {/* Metadata block: show published date, last edited date, and read time */}
              <div style={{ color: "#aaa", fontSize: "0.95rem", marginBottom: 24, lineHeight: 1.7 }}>
                <div>Published: {publishedDate}</div>
                {lastEditedDate && <div>Last edited: {lastEditedDate}</div>}
                {readTime && <div>{readTime}</div>}
              </div>
              {headings.length > 1 && (
                <nav style={{ marginBottom: 32, background: "#fafbfc", border: "1px solid #eee", borderRadius: 6, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Table of Contents</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {headings.map(h => (
                      <li key={h.id} style={{ marginLeft: (h.level - 2) * 16, marginBottom: 4 }}>
                        <a href={`#${h.id}`} style={{ color: "#555", textDecoration: "underline dotted" }}>{h.text}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <div className="prose" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
                <MDXRemote source={contentWithAnchors} />
              </div>
              {related.length > 0 && (
                <aside style={{ marginTop: 48, borderTop: "1px solid #eee", paddingTop: 24 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Related {section?.name}</div>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {related.map(e => (
                      <li key={e.slug} style={{ marginBottom: 16 }}>
                        <Link href={`/${sectionSlug}/${e.slug}`} style={{ fontWeight: 500 }}>{e.title}</Link>
                        {e.summary && <span style={{ color: "#888", marginLeft: 8 }}>{e.summary}</span>}
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
              <Footer />
            </div>
          </>
        );
      } catch (err) {
        return <div style={{ padding: 40, textAlign: "center", color: "red" }}>Error rendering page: {String(err)}</div>;
      }
    }
    // Not found
    return <div style={{ padding: 40, textAlign: "center" }}>404 – Page not found</div>;
  }

  // Not found (too many segments)
  return <div style={{ padding: 40, textAlign: "center" }}>404 – Page not found</div>;
} 