export interface ContentItem {
  title?: string
  section: string
  date?: string
  summary?: string
  tags?: string[]
  slug: string
  url: string
  readTime?: string
  filePath: string
  published?: boolean
  lastEdited?: string
  effectiveDate?: string
  [key: string]: string | string[] | boolean | undefined
}

export interface SitePage {
  title: string
  slug: string
  section?: string
  filePath: string
  published?: boolean
}

export interface SiteSection {
  name: string
  slug: string
  pages: SitePage[]
}

export interface SiteStructure {
  sections: SiteSection[]
  topLevelPages: SitePage[]
}

export interface NavLink {
  name: string
  href: string
  external?: boolean
}

export interface Heading {
  level: number
  text: string
  id: string
}

export interface ArticlePageProps {
  content: string
  data: Record<string, unknown>
  headings: Heading[]
  related: ContentItem[]
  publishedDate: string
  lastEditedDate?: string
  readTime: string
  canonicalUrl: string
}

export interface SectionPageProps {
  section: SiteSection
  items: ContentItem[]
}

export interface HomePageProps {
  recent: ContentItem[]
}

export interface PageParams {
  slug?: string[]
}

export interface MetaData {
  title: string
  description: string
  canonical?: string
  openGraph?: {
    title: string
    description: string
    type: string
    url: string
  }
  twitter?: {
    card: string
    title: string
    description: string
  }
}