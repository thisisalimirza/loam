import { NavLink } from "@/types";
import BreadcrumbsClient from "./BreadcrumbsClient";

export default function BreadcrumbsServer() {
  const navLinks: NavLink[] = [
    { name: "Notes", href: "/writing" },
    { name: "Meditations", href: "/meditations" },
    { name: "Newsletter", href: "https://thisisalimirza.substack.com", external: true },
  ];
  return <BreadcrumbsClient navLinks={navLinks} />;
}
