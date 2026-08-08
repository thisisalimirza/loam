import { NextRequest } from "next/server"

import { ogCard } from "@/app/components/OgCard"
import { siteConfig } from "@/config/site"

/** Guard rails on reflected text, so a hand-crafted URL can't produce a wall of glyphs. */
const LIMITS = { title: 140, eyebrow: 60, meta: 40 }

function read(params: URLSearchParams, key: keyof typeof LIMITS): string | undefined {
  const value = params.get(key)?.replace(/\s+/g, " ").trim()
  return value ? value.slice(0, LIMITS[key]) : undefined
}

/**
 * Social cards for every page, drawn on demand and then cached at the edge.
 *
 * This lives as a route rather than the `opengraph-image` file convention
 * because the site's pages hang off an optional catch-all, and Next won't allow
 * a nested image segment underneath one.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const response = ogCard({
    title: read(params, "title") ?? siteConfig.title,
    eyebrow: read(params, "eyebrow"),
    meta: read(params, "meta"),
  })

  // The card is a pure function of the query string, so it never needs revalidating.
  response.headers.set("Cache-Control", "public, immutable, no-transform, max-age=31536000")
  return response
}
