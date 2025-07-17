import { siteConfig } from "@/config/site"

interface StructuredDataProps {
  type: "website" | "article"
  title?: string
  description?: string
  url?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
}

export default function StructuredData({
  type,
  title,
  description,
  url,
  publishedTime,
  modifiedTime,
  section
}: StructuredDataProps) {
  const baseUrl = siteConfig.url
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl

  let structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
  }

  if (type === "website") {
    structuredData = {
      ...structuredData,
      "@type": "WebSite",
      name: siteConfig.name,
      description: siteConfig.description,
      url: baseUrl,
      author: {
        "@type": "Person",
        name: siteConfig.author.name,
        email: siteConfig.author.email,
      },
    }
  } else if (type === "article") {
    structuredData = {
      ...structuredData,
      "@type": "BlogPosting",
      headline: title,
      description: description,
      url: fullUrl,
      author: {
        "@type": "Person",
        name: siteConfig.author.name,
        email: siteConfig.author.email,
      },
      publisher: {
        "@type": "Person",
        name: siteConfig.author.name,
      },
      datePublished: publishedTime,
      dateModified: modifiedTime,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": fullUrl,
      },
    }

    if (section) {
      structuredData.articleSection = section
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}