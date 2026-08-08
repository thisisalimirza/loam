import { siteConfig } from "@/config/site"
import { absoluteUrl, SITE_URL } from "@/lib/seo"

/** Stable @id values so the graph nodes can reference one another. */
const PERSON_ID = `${SITE_URL}/#person`
const SITE_ID = `${SITE_URL}/#website`

/**
 * The author node. Deliberately no email — it would be published verbatim in
 * every page's markup for scrapers to lift.
 */
function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: siteConfig.author.name,
    url: SITE_URL,
    image: absoluteUrl(siteConfig.images.profile),
    sameAs: [siteConfig.links.twitter, siteConfig.links.github, siteConfig.links.newsletter],
  }
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: siteConfig.name,
    description: siteConfig.description,
    url: SITE_URL,
    inLanguage: "en-US",
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  }
}

export interface Crumb {
  name: string
  /** Site-relative path. Omit on the final crumb. */
  path?: string
}

function breadcrumbNode(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  }
}

function Ld({ graph }: { graph: unknown[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  )
}

/** Homepage: who this is and what the site is. */
export function SiteSchema() {
  return <Ld graph={[personNode(), websiteNode()]} />
}

interface ArticleSchemaProps {
  title: string
  description?: string
  path: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  crumbs?: Crumb[]
}

/** An essay, memo, vignette or standalone page. */
export function ArticleSchema({
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  section,
  tags,
  crumbs,
}: ArticleSchemaProps) {
  const url = absoluteUrl(path)

  const article: Record<string, unknown> = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: title,
    url,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": SITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "en-US",
  }

  if (description) article.description = description
  if (publishedTime) article.datePublished = publishedTime
  // Google treats a missing dateModified as equal to publication.
  if (modifiedTime || publishedTime) article.dateModified = modifiedTime ?? publishedTime
  if (section) article.articleSection = section
  if (tags?.length) article.keywords = tags.join(", ")

  return <Ld graph={[article, ...(crumbs ? [breadcrumbNode(crumbs)] : [])]} />
}

/** A section index or other list page. */
export function CollectionSchema({
  title,
  description,
  path,
  crumbs,
}: {
  title: string
  description?: string
  path: string
  crumbs?: Crumb[]
}) {
  const url = absoluteUrl(path)
  return (
    <Ld
      graph={[
        {
          "@type": "CollectionPage",
          "@id": `${url}#collection`,
          name: title,
          ...(description ? { description } : {}),
          url,
          isPartOf: { "@id": SITE_ID },
          author: { "@id": PERSON_ID },
          inLanguage: "en-US",
        },
        ...(crumbs ? [breadcrumbNode(crumbs)] : []),
      ]}
    />
  )
}

interface SourceSchemaProps {
  title: string
  author: string | null
  kind: string
  path: string
  description: string
  coverUrl: string | null
  /** Passages quoted on the page, used for the Quotation nodes. */
  quotes: string[]
  crumbs?: Crumb[]
}

/**
 * A book (or article/podcast) page. The book itself is the subject; the page is
 * a commentary on it carrying a set of quotations.
 */
export function SourceSchema({
  title,
  author,
  kind,
  path,
  description,
  coverUrl,
  quotes,
  crumbs,
}: SourceSchemaProps) {
  const url = absoluteUrl(path)
  const workType = kind === "book" ? "Book" : kind === "podcast" ? "PodcastEpisode" : "Article"

  const work: Record<string, unknown> = {
    "@type": workType,
    "@id": `${url}#work`,
    name: title,
    ...(author ? { author: { "@type": "Person", name: author } } : {}),
    ...(coverUrl ? { image: coverUrl } : {}),
  }

  return (
    <Ld
      graph={[
        {
          "@type": "WebPage",
          "@id": url,
          name: title,
          description,
          url,
          isPartOf: { "@id": SITE_ID },
          author: { "@id": PERSON_ID },
          inLanguage: "en-US",
          about: { "@id": `${url}#work` },
          mainEntity: { "@id": `${url}#work` },
        },
        work,
        // A capped sample — enough to describe the page without shipping a
        // multi-megabyte blob of JSON-LD on the longest books.
        ...quotes.slice(0, 20).map((text, i) => ({
          "@type": "Quotation",
          "@id": `${url}#quote-${i + 1}`,
          text,
          isPartOf: { "@id": `${url}#work` },
          ...(author ? { creator: { "@type": "Person", name: author } } : {}),
        })),
        ...(crumbs ? [breadcrumbNode(crumbs)] : []),
      ]}
    />
  )
}
