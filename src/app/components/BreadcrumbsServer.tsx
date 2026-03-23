import { NavLink } from "@/types";
import BreadcrumbsClient from "./BreadcrumbsClient";

export default function BreadcrumbsServer() {
  const navLinks: NavLink[] = [
    { name: "Ali Mirza", href: "/" },
    { name: "Writing", href: "/writing" },
    { name: "Newsletter", href: "https://thisisalimirza.substack.com", external: true },
  ];
  return <BreadcrumbsClient navLinks={navLinks} />;
}
