# Ali Mirza – Personal Website

This is the codebase for Ali Mirza's living archive: essays, meditations, memos, and more.

## Content Management

- **Add a new essay, memo, vignette, etc.:**
  - Drop a new `.mdx` or `.md` file into the appropriate folder in `/content/` (e.g., `/content/essays/`, `/content/memos/`).
  - Each file = one publication. Use YAML frontmatter for metadata (see below).
- **Update a living list (e.g., Meditations):**
  - Edit the single Markdown file (e.g., `/content/meditations.md`).
- **Legacy archive:**
  - The `/content/CONTNET.md` file is a full export of your old content. It is parsed and rendered in the appropriate sections.

## Content Structure

```
/content/
  /essays/         # New essays (one file per essay)
  /memos/          # New memos (one file per memo)
  /vignettes/      # New vignettes (one file per vignette)
  meditations.md   # Living list of meditations
  CONTNET.md       # Legacy archive (imported at build time)
  ...other sections as needed
```

## Frontmatter Example

```
---
title: "The Difficulty Is the Point"
type: "essay"
section: "philosophy"
date: "2022-08-25"
summary: "How I came to understand struggle as the cornerstone of my identity."
tags: ["discipline", "freedom", "stoicism"]
readTime: "7 min"
---
```

## Development

- `npm run dev` – Start local dev server
- `npm run build` – Build static site
- `npm run start` – Start production server

## Features
- Minimal, text-centered, responsive design
- Full-text search (Flexsearch)
- Dynamic /library index with filtering and hover previews
- Featured block on homepage
- Table of Contents for long posts
- Related content suggestions

---

For any new content, just add a Markdown/MDX file to the right folder. For living lists, update the single file. For legacy, update `CONTNET.md`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
