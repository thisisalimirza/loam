export const siteConfig = {
  name: "Ali Mirza",
  title: "Ali Mirza — MD Candidate, Founder & Builder",
  description: "Ali Mirza is an MD candidate at UConn and founder building across medical education, restaurant checkout, and physician community.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thisisalimirza.com",
  author: {
    name: "Ali Mirza",
    email: "ali@braskgroup.com",
    twitter: "@thisisalimirza",
  },
  links: {
    newsletter: "https://thisisalimirza.substack.com",
    github: "https://github.com/thisisalimirza",
    twitter: "https://twitter.com/thisisalimirza",
    linkedin: "https://www.linkedin.com/in/thisisalimirza",
    youtube: "https://www.youtube.com/@thisisalimirza",
    blog: "https://blog.thisisalimirza.com/",
    rounds: "https://www.getrounds.app/",
    tally: "https://tallytodayai.com/",
    mdplus: "https://mdplus.community/",
  },
  meta: {
    themeColor: "#173b30",
    locale: "en_US",
    type: "website",
  },
  images: {
    profile: "/images/ali-mirza.webp",
    og: "/og.png",
    profileSize: {
      width: 960,
      height: 1200,
    },
  },
}

export type SiteConfig = typeof siteConfig