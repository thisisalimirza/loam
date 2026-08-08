import { MDXRemote } from "next-mdx-remote/rsc"
import { ArticleSchema } from "./StructuredData"
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
      <ArticleSchema
        title={(data.title as string) || slug}
        description={data.summary as string}
        path={canonicalUrl}
        publishedTime={data.date as string}
        modifiedTime={data.lastEdited as string}
        tags={Array.isArray(data.tags) ? (data.tags as string[]) : undefined}
        crumbs={[
          { name: "Home", path: "/" },
          { name: (data.title as string) || slug },
        ]}
      />
      
      <div className="article-layout">
        
        <header className="article-header">
          <h1 className="article-title">{(typeof data.title === 'string' ? data.title : null) || slug}</h1>
          
          {/* Only render the rule-topped meta strip when there's something in it. */}
          {((typeof data.date === 'string' && data.date) ||
            (typeof data.readTime === 'string' && data.readTime)) && (
            <div className="article-meta">
              {typeof data.date === 'string' && data.date && <span>{data.date}</span>}
              {typeof data.readTime === 'string' && data.readTime && <span>{data.readTime}</span>}
            </div>
          )}

          {typeof data.summary === 'string' && data.summary && (
            <blockquote className="article-summary">
              {data.summary}
            </blockquote>
          )}
        </header>
        
        <div className="prose">
          <MDXRemote source={content} components={{ SubstackEmbed }} />
        </div>
      </div>
    </>
  )
}