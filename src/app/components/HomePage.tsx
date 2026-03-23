import BreadcrumbsServer from "./BreadcrumbsServer"
import ProfileHeader from "./ProfileHeader"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"

export default function HomePage() {
  return (
    <>
      <MetaHead />
      <StructuredData type="website" />

      <div className="page-layout">
        <BreadcrumbsServer />
        <ProfileHeader />
        <Footer />
      </div>
    </>
  )
}
