import { HomePageProps } from "@/types"
import BreadcrumbsServer from "./BreadcrumbsServer"
import ProfileHeader from "./ProfileHeader"
import RecentContent from "./RecentContent"
import Footer from "./Footer"
import MetaHead from "./MetaHead"
import StructuredData from "./StructuredData"

export default function HomePage({ recent }: HomePageProps) {
  return (
    <>
      <MetaHead />
      <StructuredData type="website" />
      
      <div className="homepage-layout">
        <div className="container">
          <BreadcrumbsServer />
        </div>
        
        <div className="homepage-content">
          <div className="homepage-inner">
            <ProfileHeader />
            <RecentContent items={recent} />
            <Footer />
          </div>
        </div>
      </div>
    </>
  )
}