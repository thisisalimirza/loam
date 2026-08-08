import { MDXRemote } from "next-mdx-remote/rsc"
import { ArticlePageProps } from "@/types"
import TableOfContents from "./TableOfContents"
import RelatedContent from "./RelatedContent"
import { ArticleSchema } from "./StructuredData"
import SubstackEmbed from "./SubstackEmbed"

export default function ArticlePage({
  content,
  data,
  headings,
  related,
  publishedDate,
  lastEditedDate,
  readTime,
  canonicalUrl,
  sectionName,
  sectionSlug
}: ArticlePageProps & { sectionName?: string; sectionSlug: string }) {
  return (
    <>
      <ArticleSchema
        title={data.title as string}
        description={data.summary as string}
        path={canonicalUrl}
        publishedTime={publishedDate}
        modifiedTime={lastEditedDate}
        section={sectionName}
        tags={Array.isArray(data.tags) ? (data.tags as string[]) : undefined}
        crumbs={[
          { name: "Home", path: "/" },
          { name: sectionName ?? sectionSlug, path: `/${sectionSlug}` },
          { name: (data.title as string) ?? "Untitled" },
        ]}
      />
      
      <div className="article-layout">
        
        <header className="article-header">
          <h1 className="article-title">{typeof data.title === 'string' ? data.title : 'Untitled'}</h1>
          {typeof data.summary === 'string' && data.summary && (
            <blockquote className="article-summary">
              {data.summary}
            </blockquote>
          )}
          
          <div className="article-metadata">
            {publishedDate && <div>Published: {publishedDate}</div>}
            {lastEditedDate && <div>Last edited: {lastEditedDate}</div>}
            {readTime && <div>{readTime}</div>}
          </div>
        </header>
        
        <TableOfContents headings={headings} />
        
        <div className="prose" style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
          <MDXRemote source={content} components={{ SubstackEmbed }} />
        </div>
        
        <RelatedContent
          items={related}
          sectionName={sectionName}
          sectionSlug={sectionSlug}
        />
      </div>
    </>
  )
}