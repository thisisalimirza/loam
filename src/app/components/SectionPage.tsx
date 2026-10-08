import { SectionPageProps } from "@/types"
import { CollectionSchema } from "./StructuredData"
import SectionListClient from "./SectionListClient"

export default function SectionPage({ section, items }: SectionPageProps) {
  return (
    <>
      <CollectionSchema
        title={section.name}
        description={`Writing filed under ${section.name.toLowerCase()}.`}
        path={`/${section.slug}`}
        crumbs={[{ name: "Home", path: "/" }, { name: section.name }]}
      />

      <div className="page-layout">
        <div className="page-head">
          <h1 className="page-title">{section.name}</h1>
        </div>

        <SectionListClient items={items} />
      </div>
    </>
  )
}
