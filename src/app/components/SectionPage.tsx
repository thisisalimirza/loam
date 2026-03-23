import { SectionPageProps } from "@/types"
import BreadcrumbsServer from "./BreadcrumbsServer"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import SectionListClient from "./SectionListClient"

export default function SectionPage({ section, items }: SectionPageProps) {
  return (
    <>
      <MetaHead
        title={section.name}
        description={`${section.name} by Ali Mirza`}
        canonical={`/${section.slug}`}
      />

      <div className="page-layout">
        <BreadcrumbsServer />

        <h1 className="page-title">{section.name}</h1>

        <SectionListClient items={items} />

        <Footer />
      </div>
    </>
  )
}