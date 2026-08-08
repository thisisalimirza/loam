import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

/** Origin with any trailing slash removed, so joins never double up. */
export const SITE_URL = siteConfig.url.replace(/\/+$/, "")

/** Absolute URL for a site-relative path. */
export function absoluteUrl(pathname = "/"): string {
  if (!pathname || pathname === "/") return SITE_URL
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

/**
 * Cut to a whole word at or under `max`. Meta descriptions get truncated by
 * Google somewhere around 155–160 characters, so that's the default ceiling.
 */
export function truncate(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`
}

/**
 * Reduce MDX to plain prose suitable for a meta description. Used as the
 * fallback for the posts that never got a `summary` in their frontmatter.
 */
export function excerpt(markdown: string, max = 158): string {
  const prose = markdown
    // Fenced code, JSX blocks and HTML comments carry no descriptive value.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^import .*$/gm, " ")
    // Images before links, so alt text doesn't survive as prose.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, " ")
    .replace(/^\s{0,3}>\s?/gm, " ")
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, " ")
    .replace(/[*_~`]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return truncate(prose, max)
}

interface PageMetaInput {
  title: string
  /** Use the title exactly as given, without the `– Ali Mirza` suffix appended. */
  absoluteTitle?: boolean
  description: string
  /** Site-relative path, e.g. `/essays/gnothi-sauton`. */
  path: string
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  /** Keep the page out of the index but let crawlers follow its links. */
  noIndex?: boolean
  /** Point the canonical somewhere else — used to fold duplicate sources together. */
  canonicalPath?: string
  /** Small line above the title on the social card. */
  ogEyebrow?: string
  /** Small line in the card's bottom-right corner. */
  ogMeta?: string
}

/**
 * URL of the generated social card for a page. Built from the page's own title
 * so a shared link previews as itself rather than as the site's avatar.
 */
export function ogImageUrl(title: string, eyebrow?: string, meta?: string): string {
  const params = new URLSearchParams({ title })
  if (eyebrow) params.set("eyebrow", eyebrow)
  if (meta) params.set("meta", meta)
  return `${SITE_URL}/og?${params.toString()}`
}

/**
 * The single place page metadata is assembled. Every route funnels through
 * here so titles, canonicals and social cards can't drift apart again.
 */
export function buildMetadata({
  title,
  absoluteTitle,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
  noIndex,
  canonicalPath,
  ogEyebrow,
  ogMeta,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path)
  const canonical = canonicalPath ?? path
  const desc = truncate(description)
  const images = [
    { url: ogImageUrl(title, ogEyebrow, ogMeta), width: 1200, height: 630, alt: title },
  ]

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.meta.locale,
      type: type === "article" ? "article" : "website",
      images,
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors: [siteConfig.author.name],
            tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      creator: siteConfig.author.twitter,
      images,
    },
    ...(noIndex
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
  }
}
