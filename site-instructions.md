# Site Instructions: Ali Mirza – Personal Website

Welcome! This document will help you get up to speed with managing, developing, and contributing to Ali Mirza's personal website. It covers everything you need to know, whether you're a developer or a content editor.

---

## 1. Project Overview

This site is a modern, minimal, and scalable digital archive for essays, meditations, memos, vignettes, projects, and more. Content is managed via Markdown/MDX files—no CMS required.

---

## 2. Content Structure & Management

All content lives in the `/content/` directory:

```
/content/
  /essays/         # New essays (one file per essay)
  /memos/          # New memos (one file per memo)
  /vignettes/      # New vignettes (one file per vignette)
  /projects/       # New projects (one file per project)
  meditations.md   # Living list of meditations
  CONTNET.md       # Legacy archive (imported at build time)
  ...other sections as needed
```

### Adding New Content
- **Essays, Memos, Vignettes, Projects:**
  - Add a new `.mdx` or `.md` file to the appropriate folder.
  - Each file = one post. Use YAML frontmatter (see below).
- **Living Lists (e.g., Meditations):**
  - Edit the single Markdown file (e.g., `meditations.md`).
- **Legacy Content:**
  - Update `CONTNET.md` if needed (rare).

### Frontmatter Example
Each content file should start with YAML frontmatter for metadata:

```
---
title: "The Difficulty Is the Point"
date: "2022-08-25"
summary: "How I came to understand struggle as the cornerstone of my identity."
tags: ["discipline", "freedom", "stoicism"]
readTime: "7 min"
---
```
- `title` (required): The post title
- `date` (recommended): YYYY-MM-DD
- `summary` (optional): Short description
- `tags` (optional): Array of tags
- `readTime` (optional): Estimated reading time

### Content Guidelines
- Use clear, descriptive titles and summaries.
- Use tags for discoverability.
- For living lists, keep the file up to date.

---

## 3. Development & Deployment

### Local Development
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Visit [http://localhost:3000](http://localhost:3000)
- Edit files in `/src/app/` or `/content/` and the site will auto-update.

### Build & Production
- Build static site: `npm run build`
- Start production server: `npm run start`

### Deployment
- Deploy to [Vercel](https://vercel.com/) for best results (auto-detects Next.js projects).
- Or deploy to any platform that supports Node.js/Next.js.

---

## 4. Codebase Overview

- **/src/app/**: All Next.js app code (pages, components, styles)
- **/src/lib/**: Utilities (e.g., content loader)
- **/content/**: All Markdown/MDX content
- **/public/**: Static assets (images, favicon, etc.)

---

## 5. Content Validation & Best Practices

- Always use valid YAML frontmatter.
- Keep filenames URL-friendly (lowercase, hyphens, no spaces).
- Preview your changes locally before deploying.
- For new sections, create a new folder in `/content/` and update the loader if needed.

---

## 6. Troubleshooting

- **Content not showing up?**
  - Check for frontmatter errors or missing required fields.
  - Make sure the file is in the correct folder.
- **Build errors?**
  - Run `npm install` to ensure dependencies are up to date.
  - Check for typos in imports or file paths.

---

## 7. Further Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MDX Documentation](https://mdxjs.com/)
- [Vercel Deployment Docs](https://vercel.com/docs)

---

## 8. Contact

For questions or help, contact Ali Mirza or the current maintainer.

---

**You're ready to go!**
- Add new content by dropping files into `/content/`.
- Edit, preview, and deploy with confidence.
- Keep the archive growing and evolving. 