import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type ContentItem = {
  title?: string;
  section: string;
  date?: string;
  summary?: string;
  tags?: string[];
  slug: string;
  url: string;
  readTime?: string;
  filePath: string;
  published?: boolean;
};

export function getAllContent(): ContentItem[] {
  const content: ContentItem[] = [];
  const contentDir = path.join(process.cwd(), "content");
  const entries = fs.readdirSync(contentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const section = entry.name;
      const dir = path.join(contentDir, section);
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".mdx"));
      for (const filename of files) {
        const file = fs.readFileSync(path.join(dir, filename), "utf8");
        const { content: mdContent, data } = matter(file);
        content.push({
          ...data,
          section,
          slug: filename.replace(/\.mdx$/, ""),
          url: `/${section}/${filename.replace(/\.mdx$/, "")}`,
          readTime: data.readTime || readingTime(mdContent).text,
          filePath: path.join(dir, filename),
          published: data.published !== false,
        } as ContentItem);
      }
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      // Top-level .mdx file
      const filePath = path.join(contentDir, entry.name);
      const file = fs.readFileSync(filePath, "utf8");
      const { content: mdContent, data } = matter(file);
      content.push({
        ...data,
        section: "",
        slug: entry.name.replace(/\.mdx$/, ""),
        url: `/${entry.name.replace(/\.mdx$/, "")}`,
        readTime: data.readTime || readingTime(mdContent).text,
        filePath,
        published: data.published !== false,
      } as ContentItem);
    } else if (entry.isFile() && entry.name === "meditations.md") {
      // Special case for meditations.md
      const filePath = path.join(contentDir, entry.name);
      const file = fs.readFileSync(filePath, "utf8");
      const { content: mdContent, data } = matter(file);
      content.push({
        ...data,
        section: "meditations",
        slug: "meditations",
        url: "/meditations",
        readTime: data.readTime || readingTime(mdContent).text,
        filePath,
        published: data.published !== false,
      } as ContentItem);
    }
  }
  return content;
}

export function getContentBySlug(section: string, slug: string): ContentItem | null {
  if (section === "meditations") {
    const filePath = path.join(process.cwd(), "content", "meditations.md");
    if (!fs.existsSync(filePath)) return null;
    const file = fs.readFileSync(filePath, "utf8");
    const { content: mdContent, data } = matter(file);
    return {
      ...data,
      section,
      slug: "meditations",
      url: "/meditations",
      readTime: data.readTime || readingTime(mdContent).text,
      filePath,
      published: data.published !== false,
    } as ContentItem;
  } else {
    const filePath = path.join(process.cwd(), "content", section, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return null;
    const file = fs.readFileSync(filePath, "utf8");
    const { content: mdContent, data } = matter(file);
    return {
      ...data,
      section,
      slug,
      url: `/${section}/${slug}`,
      readTime: data.readTime || readingTime(mdContent).text,
      filePath,
      published: data.published !== false,
    } as ContentItem;
  }
} 