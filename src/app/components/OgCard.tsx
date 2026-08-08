import { ImageResponse } from "next/og"
import { siteConfig } from "@/config/site"

/** Facebook, LinkedIn and X all crop to this; anything else gets letterboxed. */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

interface OgCardProps {
  title: string
  /** Small line above the title — section, author, or byline. */
  eyebrow?: string
  /** Supporting line below the title. */
  meta?: string
}

/**
 * The site's social card. Rendered at build time into a real 1200×630 PNG so a
 * shared link shows the piece's own title instead of a 120px avatar.
 */
export function ogCard({ title, eyebrow, meta }: OgCardProps) {
  // Long titles need to step down a size or two to stay on the card.
  const fontSize = title.length > 90 ? 52 : title.length > 55 ? 64 : 78

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf7f1",
          padding: "72px 80px",
          borderTop: "16px solid #b23a20",
        }}
      >
        {eyebrow ? (
          <div
            style={{
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#837b6d",
            }}
          >
            {eyebrow}
          </div>
        ) : (
          <div />
        )}

        <div
          style={{
            display: "flex",
            fontSize,
            lineHeight: 1.15,
            color: "#17171b",
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26 }}>
          <div style={{ color: "#17171b", fontWeight: 600 }}>{siteConfig.name}</div>
          <div style={{ color: "#837b6d" }}>{meta ?? siteConfig.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
