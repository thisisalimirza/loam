export const siteConfig = {
  name: "Ali Mirza",
  title: "Ali Mirza – Personal Website",
  description: "Essays, meditations, memos, vignettes, and projects by Ali Mirza.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://alimirza.com",
  author: {
    name: "Ali Mirza",
    email: "ali@janusny.com",
    twitter: "@thisisalimirza",
  },
  links: {
    newsletter: "https://thisisalimirza.substack.com",
    github: "https://github.com/thisisalimirza",
    twitter: "https://twitter.com/thisisalimirza",
  },
  meta: {
    themeColor: "#2563eb",
    locale: "en_US",
    type: "website",
  },
  images: {
    profile: "/profilepic.jpg",
    profileSize: {
      width: 120,
      height: 120,
    },
  },
}

export type SiteConfig = typeof siteConfig