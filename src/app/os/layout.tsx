import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./os.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: { default: "Loam OS", template: "%s · Loam OS" },
  robots: { index: false, follow: false, nocache: true },
}
export const viewport = { themeColor: "#f6f7fb" }

export default function OsRoot({ children }: { children: React.ReactNode }) {
  return <div className={`os ${inter.variable}`}>{children}</div>
}
