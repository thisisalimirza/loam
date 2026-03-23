export const siteConfig = {
  name: "Ali Mirza",
  title: "Ali Mirza – Personal Website",
  description: "Ali Mirza is a medical student, builder, and writer. Essays on medicine, systems, and building software — plus Side Effects, a newsletter.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thisisalimirza.com",
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