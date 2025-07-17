import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Head from "next/head";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ali Mirza – Personal Website",
  description: "Essays, meditations, memos, vignettes, and projects by Ali Mirza.",
  icons: {
    icon: "/favicon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="author" content="Ali Mirza" />
        <meta property="og:title" content="Ali Mirza – Personal Website" />
        <meta property="og:description" content="Essays, meditations, memos, vignettes, and projects by Ali Mirza." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content="https://alimirza.com/" />
        <meta property="og:site_name" content="Ali Mirza" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Ali Mirza – Personal Website" />
        <meta name="twitter:description" content="Essays, meditations, memos, vignettes, and projects by Ali Mirza." />
        <link rel="canonical" href="https://alimirza.com/" />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header role="banner" aria-label="Site header" />
        <main id="main-content" role="main" tabIndex={-1}>
          {children}
        </main>
        <footer role="contentinfo" aria-label="Site footer" />
      </body>
    </html>
  );
}
