import { MDXRemote } from "next-mdx-remote/rsc"
import { ArticlePageProps } from "@/types"
import BreadcrumbsServer from "./BreadcrumbsServer"
import TableOfContents from "./TableOfContents"
import RelatedContent from "./RelatedContent"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"
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
      <MetaHead
        title={data.title as string}
        description={data.summary as string}
        canonical={canonicalUrl}
        type="article"
        publishedTime={publishedDate}
        modifiedTime={lastEditedDate}
      />
      <StructuredData
        type="article"
        title={data.title as string}
        description={data.summary as string}
        url={canonicalUrl}
        publishedTime={publishedDate}
        modifiedTime={lastEditedDate}
        section={sectionName}
      />
      
      <div className="article-layout">
        <BreadcrumbsServer />
        
        <header className="article-header">
          <h1 className="article-title">{typeof data.title === 'string' ? data.title : 'Untitled'}</h1>
          {typeof data.summary === 'string' && data.summary && (
            <blockquote className="article-summary">
              {data.summary}
            </blockquote>
          )}
          
          <div className="article-metadata">
            <div>Published: {publishedDate}</div>
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
        
        <Footer />
      </div>
    </>
  )
}