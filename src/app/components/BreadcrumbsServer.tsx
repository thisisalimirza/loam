import { NavLink } from "@/types";
import BreadcrumbsClient from "./BreadcrumbsClient";

export default function BreadcrumbsServer() {
  const navLinks: NavLink[] = [
    // Temporarily hidden — writing is reachable via "browse everything" on the home page.
    // { name: "Writing", href: "/writing" },
    { name: "About", href: "/about" },
    { name: "Reading", href: "/reading" },
    { name: "Projects", href: "/projects" },
    { name: "Future", href: "/future" },
    { name: "Meditations", href: "/meditations" },
    { name: "Newsletter", href: "https://thisisalimirza.substack.com", external: true },
  ];
  return <BreadcrumbsClient navLinks={navLinks} />;
}
