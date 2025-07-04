import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type SitePage = {
  title: string;
  slug: string;
  section?: string;
  filePath: string;
  published?: boolean;
};

export type SiteSection = {
  name: string;
  slug: string;
  pages: SitePage[];
};

export type SiteStructure = {
  sections: SiteSection[];
  topLevelPages: SitePage[];
};

export function getSiteStructure(): SiteStructure {
  const contentDir = path.join(process.cwd(), "content");
  const entries = fs.readdirSync(contentDir, { withFileTypes: true });

  const sections: SiteSection[] = [];
  const topLevelPages: SitePage[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Section folder
      const sectionName = entry.name;
      const sectionSlug = sectionName;
      const sectionDir = path.join(contentDir, sectionName);
      const files = fs.readdirSync(sectionDir).filter(f => f.endsWith(".mdx"));
      const pages: SitePage[] = files.map(filename => {
        const filePath = path.join(sectionDir, filename);
        const file = fs.readFileSync(filePath, "utf8");
        const { data } = matter(file);
        return {
          title: data.title || filename.replace(/\.mdx$/, ""),
          slug: filename.replace(/\.mdx$/, ""),
          section: sectionSlug,
          filePath,
          published: data.published !== false,
        };
      });
      sections.push({
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        slug: sectionSlug,
        pages,
      });
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      // Top-level .mdx file
      const filePath = path.join(contentDir, entry.name);
      const file = fs.readFileSync(filePath, "utf8");
      const { data } = matter(file);
      topLevelPages.push({
        title: data.title || entry.name.replace(/\.mdx$/, ""),
        slug: entry.name.replace(/\.mdx$/, ""),
        filePath,
        published: data.published !== false,
      });
    }
  }

  return { sections, topLevelPages };
} 