import { getSiteStructure } from "@/lib/getSiteStructure";
import { NavLink } from "@/types";
import BreadcrumbsClient from "./BreadcrumbsClient";

export default function BreadcrumbsServer() {
  // This is a server component, so we can't use usePathname directly.
  // Instead, pass pathname as a prop from the parent if needed, or use a workaround for now.
  // For now, we'll just pass navLinks.
  const { sections, topLevelPages } = getSiteStructure();

  const navLinks: NavLink[] = [
    { name: "Home", href: "/" },
    ...sections
      .filter(s => s.pages.some(p => p.published !== false))
      .map(s => ({ name: s.name, href: `/${s.slug}` })),
    ...topLevelPages
      .filter(p => p.published !== false)
      .map(p => ({ name: p.title, href: `/${p.slug}` })),
    { name: "Newsletter", href: "https://thisisalimirza.substack.com", external: true }
  ];
  return <BreadcrumbsClient navLinks={navLinks} />;
} 