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

const sections = ["essays", "memos", "vignettes", "projects", "meditations"];

export function getAllContent(): ContentItem[] {
  const content: ContentItem[] = [];
  for (const section of sections) {
    if (section === "meditations") {
      // Only one file for meditations
      const filePath = path.join(process.cwd(), "content", "meditations.md");
      if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath, "utf8");
        const { content: mdContent, data } = matter(file);
        content.push({
          ...data,
          section,
          slug: "meditations",
          url: "/meditations",
          readTime: data.readTime || readingTime(mdContent).text,
          filePath,
          published: data.published !== false,
        } as ContentItem);
      }
    } else {
      const dir = path.join(process.cwd(), "content", section);
      if (!fs.existsSync(dir)) continue;
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