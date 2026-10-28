import { listFiles } from "@/lib/os/site"
import { todayISO } from "@/lib/os/dates"
import SiteEditor from "../SiteEditor"

export const metadata = { title: "New post" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

export default async function New({ searchParams }: { searchParams: Promise<{ section?: string; title?: string; body?: string }> }) {
  const { section = "", title = "", body = "" } = await searchParams
  const { sections } = await listFiles()
  return <SiteEditor sections={sections} defaultSection={sections.includes(section) ? section : sections[0] ?? "_pages"}
    post={{ path: "", sha: "", section: "", slug: "", title, body, date: todayISO(), summary: "", tags: [], published: true, url: "" }} />
}
