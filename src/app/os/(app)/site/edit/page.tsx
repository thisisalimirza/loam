import { notFound } from "next/navigation"
import { getPost, listFiles, liveUrl } from "@/lib/os/site"
import SiteEditor from "../SiteEditor"

export const metadata = { title: "Edit post" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

export default async function Edit({ searchParams }: { searchParams: Promise<{ path?: string; created?: string }> }) {
  const { path = "", created } = await searchParams
  const post = await getPost(path)
  if (!post) notFound()
  const { sections } = await listFiles()
  return <SiteEditor post={{ ...post, url: liveUrl(post) }} sections={sections} created={!!created} />
}
