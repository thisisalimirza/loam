import { SectionPageProps } from "@/types"
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
        <div className="page-head">
          <p className="eyebrow">Section</p>
          <h1 className="page-title">{section.name}</h1>
        </div>

        <SectionListClient items={items} />
      </div>
    </>
  )
}