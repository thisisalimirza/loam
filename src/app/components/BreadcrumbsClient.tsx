"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function BreadcrumbsClient({ navLinks }: { navLinks: { name: string; href: string }[] }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [switcher, setSwitcher] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Collapse on outside click or Escape
  useEffect(() => {
    if (!switcher) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape") setSwitcher(false);
      if (e instanceof MouseEvent && navRef.current && !navRef.current.contains(e.target as Node)) setSwitcher(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [switcher]);

  // Build up the path for each segment
  const crumbs = [
    { name: "Home", href: "/" },
    ...segments.map((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const name = seg.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return { name, href };
    })
  ];

  // Find the index of the current section in the breadcrumb
  const sectionIndex = crumbs.findIndex(crumb => navLinks.some(s => s.name === crumb.name));
  // The rest of the breadcrumb after the section
  const restCrumbs = sectionIndex >= 0 ? crumbs.slice(sectionIndex + 1) : crumbs.slice(1);

  return (
    <nav aria-label="Breadcrumb" style={{ margin: "1.2rem 0 1.5rem 0" }} ref={navRef} onMouseLeave={() => { if (switcher) setSwitcher(false); }}>
      <ol style={{ display: "flex", flexWrap: "wrap", listStyle: "none", padding: 0, fontSize: "0.98rem", color: "var(--muted)", alignItems: "center" }}>
        {/* Home always present as a Link unless switcher is open */}
        {!switcher && (
          <li style={{ display: "flex", alignItems: "center" }}>
            <Link
              href="/"
              style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 500, fontSize: "1.05rem", padding: "0 2px", borderRadius: 4, background: "none", border: "none", textDecoration: "none" }}
              tabIndex={0}
              onMouseEnter={() => { if (window.innerWidth > 800) setSwitcher(true); }}
              onClick={e => {
                if (window.innerWidth <= 800) {
                  e.preventDefault();
                  setSwitcher(true);
                }
              }}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setSwitcher(true); e.preventDefault(); } }}
              aria-haspopup="true"
            >
              {switcher ? "Home" : "Menu"}
            </Link>
          </li>
        )}
        {/* Section switcher inline, including Home, when open */}
        {switcher && navLinks.map((section, idx) => {
          const isActive = pathname === section.href || (section.href !== "/" && pathname.startsWith(section.href));
          return (
            <li key={section.href} style={{ display: "flex", alignItems: "center" }}>
              {idx > 0 && <span style={{ margin: "0 0.5em" }}>/</span>}
              <Link
                href={section.href}
                style={{
                  color: isActive ? "#2563eb" : "var(--accent)",
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: isActive ? "underline" : "none",
                  fontSize: "1.05rem",
                  padding: "0 2px",
                  borderRadius: 4,
                  background: isActive ? "#e8f0fe" : "none",
                  outline: hoveredIdx === idx ? "2px solid var(--accent)" : "none",
                  transition: "background 0.15s, color 0.15s, outline 0.15s"
                }}
                onClick={() => setSwitcher(false)}
                tabIndex={0}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
              >
                {section.name}
              </Link>
            </li>
          );
        })}
        {/* The rest of the breadcrumb */}
        {((!switcher && crumbs.length > 1) ? crumbs.slice(1) : restCrumbs).map((crumb, i) => (
          <li key={crumb.href} style={{ display: "flex", alignItems: "center" }}>
            <span style={{ margin: "0 0.5em" }}>/</span>
            {i < restCrumbs.length - 1 ? (
              <Link href={crumb.href} style={{ color: "var(--accent)", textDecoration: "none" }}>{crumb.name}</Link>
            ) : (
              <span aria-current="page" style={{ color: "var(--muted)", fontWeight: 500 }}>{crumb.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 