import { MDXRemote } from "next-mdx-remote/rsc"
import BreadcrumbsServer from "./BreadcrumbsServer"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"
import SubstackEmbed from "./SubstackEmbed"

interface TopLevelPageProps {
  content: string
  data: Record<string, unknown>
  canonicalUrl: string
  slug: string
}

export default function TopLevelPage({ 
  content, 
  data, 
  canonicalUrl, 
  slug 
}: TopLevelPageProps) {
  return (
    <>
      <MetaHead
        title={(data.title as string) || slug}
        description={data.summary as string}
        canonical={canonicalUrl}
        type="article"
      />
      <StructuredData
        type="article"
        title={(data.title as string) || slug}
        description={data.summary as string}
        url={canonicalUrl}
        publishedTime={data.date as string}
        modifiedTime={data.lastEdited as string}
      />
      
      <div className="article-layout">
        <BreadcrumbsServer />
        
        <header className="article-header">
          <h1 className="article-title">{(typeof data.title === 'string' ? data.title : null) || slug}</h1>
          
          <div className="article-meta">
            {typeof data.date === 'string' && data.date && <div>{data.date}</div>}
            {typeof data.readTime === 'string' && data.readTime && <div>{data.readTime}</div>}
          </div>
          
          {typeof data.summary === 'string' && data.summary && (
            <blockquote className="article-summary">
              {data.summary}
            </blockquote>
          )}
        </header>
        
        <div className="prose">
          <MDXRemote source={content} components={{ SubstackEmbed }} />
        </div>
        
        <Footer />
      </div>
    </>
  )
}