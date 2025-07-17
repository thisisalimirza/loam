import Link from "next/link"
import { SectionPageProps } from "@/types"
import BreadcrumbsServer from "./BreadcrumbsServer"
import Footer from "./Footer"
import MetaHead from "./MetaHead"

export default function SectionPage({ section, items }: SectionPageProps) {
  return (
    <>
      <MetaHead
        title={section.name}
        description={`${section.name} by Ali Mirza`}
        canonical={`/${section.slug}`}
      />
      
      <div className="container">
        <BreadcrumbsServer />
        
        <h1 className="section-header">{section.name}</h1>
        
        <ul className="content-list">
          {items.map(item => (
            <li key={item.url} className="content-item">
              <Link href={item.url} className="content-item-title">
                {item.title}
              </Link>
              <span className="content-item-meta">
                {item.effectiveDate && <> · {item.effectiveDate}</>}
                {item.readTime && <> · {item.readTime}</>}
              </span>
              {item.summary && (
                <div className="content-item-summary">{item.summary}</div>
              )}
            </li>
          ))}
        </ul>
        
        <Footer />
      </div>
    </>
  )
}