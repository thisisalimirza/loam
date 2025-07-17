import Head from "next/head"
import { siteConfig } from "@/config/site"

interface MetaHeadProps {
  title?: string
  description?: string
  canonical?: string
  type?: "website" | "article"
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

export default function MetaHead({
  title,
  description = siteConfig.description,
  canonical,
  type = "website",
  author = siteConfig.author.name,
  publishedTime,
  modifiedTime
}: MetaHeadProps) {
  const pageTitle = title ? `${title} – ${siteConfig.name}` : siteConfig.title
  const url = canonical ? `${siteConfig.url}${canonical}` : siteConfig.url

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      
      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content={siteConfig.meta.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:creator" content={siteConfig.author.twitter} />
      
      {/* Article specific */}
      {type === "article" && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
        </>
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Head>
  )
}