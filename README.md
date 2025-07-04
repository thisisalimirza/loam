# Ali Mirza – Personal Website

## 🧠 Project Purpose
A living notebook and philosophical archive for essays, meditations, memos, vignettes, and projects.  
Built for minimalism, longevity, and ease of content management.

---

## 📁 Project Structure

```
/content/         # All your writing, organized by section (essays, memos, etc.)
  essays/
    my-essay.mdx
  meditations.mdx # Living list
  ...
/public/          # Static assets (profilepic.jpg, images, etc.)
/src/
  app/            # Next.js app directory (routing, components)
  lib/            # Content utilities
```

---

## ✍️ Adding & Managing Content

- **All content lives in `/content/`** as Markdown/MDX files.
- **Sections** (essays, memos, vignettes, projects) are folders. Each new `.mdx` file is a new post.
- **Living lists** (like meditations) are single `.mdx` files.
- **Frontmatter** at the top of each file controls metadata and visibility.

### Example frontmatter:
```yaml
---
title: "The Difficulty Is the Point"
date: "2022-08-25"
summary: "How I came to understand struggle as the cornerstone of my identity."
tags: ["discipline", "freedom", "stoicism"]
readTime: "7 min"
published: true   # Set to false to hide from navigation/search (draft mode)
---
```

- **To add a new post:**  
  1. Create a new `.mdx` file in the appropriate section folder.
  2. Fill in the frontmatter.
  3. Write your content below the frontmatter.

- **To hide a post (draft):**  
  Set `published: false` in the frontmatter.  
  Drafts are only accessible by direct URL and do not appear in navigation, search, or lists.

- **To add images:**  
  Place images in `/public/` and reference them as `/yourimage.jpg` in your MDX.

- **To update the profile photo:**  
  Replace `/public/profilepic.jpg` with your new image (keep the filename).

---

## 🌐 Navigation & Structure

- **Navigation and section pages are fully dynamic.**  
  The site reads the `/content` folder structure—no manual updates needed for new sections or posts.
- **Breadcrumbs navbar** is always up-to-date and supports external links.
- **Featured/Recently Added** content is shown on the homepage.

---

## 🔍 Search

- Powered by Flexsearch.
- Searches all published content by title, summary, tags, and section.

---

## 🏷️ Metadata & SEO

- **SEO and Open Graph meta tags** are generated from frontmatter (title, summary).
- **Sitemap** is auto-generated at `/sitemap.xml` (only published content).
- **Canonical URLs** and social previews are handled automatically.

---

## 🛠️ Running & Deploying

- **Local development:**  
  ```bash
  npm install
  npm run dev
  ```
- **Build for production:**  
  ```bash
  npm run build
  npm start
  ```
- **Deploy:**  
  Deploy to Vercel, Netlify, or any platform that supports Next.js.

---

## 🧩 Extending the Site

- Add new sections by creating new folders in `/content`.
- Add new top-level pages by adding `.mdx` files directly in `/content`.
- Add external links to the navbar in `src/app/components/BreadcrumbsServer.tsx`.
- Customize homepage, featured content, or add new features as needed.

---

## 📝 Best Practices & Gotchas

- **Always use valid frontmatter.** Missing or malformed frontmatter can break navigation or search.
- **Keep filenames and slugs simple.** Use lowercase and hyphens.
- **Drafts:** Use `published: false` to hide content until ready.
- **Images:** Place in `/public/` and use root-relative paths.
- **Profile photo:** `/public/profilepic.jpg` (120x120px recommended).
- **SEO:** Use meaningful titles and summaries for best results.

---

## 🤝 For Future Maintainers

- The codebase is minimal and content-driven.  
- All navigation, search, and lists are generated from the actual content structure.
- No manual updates needed for navigation or section pages.
- If you add new features, keep the content-driven philosophy in mind.

---

**Welcome to your Library of a Mind.**  
If you're picking this up years later:  
- Start by looking in `/content/` and reading this README.
- Everything else will follow naturally.