import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Geist_Mono, EB_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ogImageUrl } from "@/lib/seo";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import { Analytics } from '@vercel/analytics/next';

/** Display face — warm, editorial, with the optical-size and wonk axes dialled in. */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

/** Interface face — nav, labels, metadata. */
const instrumentSans = Instrument_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

/** Reading face — every word of long-form prose on the site. */
const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Fallback card for any route that doesn't build its own. */
const defaultOgImage = ogImageUrl(
  "Medicine, technology, and what stays constant across centuries.",
  "Essays · Book notes · Meditations"
)

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s – ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.meta.locale,
    type: "website",
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.author.twitter,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/profilepic.ico", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/profilepic.jpg", type: "image/jpeg" }],
    shortcut: "/profilepic.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${instrumentSans.variable} ${ebGaramond.variable} ${geistMono.variable}`}>
        <div className="page-grain" aria-hidden="true" />
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        <main id="main-content" role="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <Analytics />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "qz6qu2x4ee");
          `}
        </Script>
      </body>
    </html>
  );
}
