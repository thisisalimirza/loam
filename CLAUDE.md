# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js and TypeScript configurations

## Architecture Overview

This is a Next.js 15 personal website built with TypeScript, using the App Router architecture. The site dynamically generates navigation and content from MDX files in the `/content` directory.

### Key Components

- **Dynamic Routing**: Uses `[[...slug]]` catch-all route in `src/app/[[...slug]]/page.tsx` to handle all content pages
- **Content System**: Two main utilities in `src/lib/`:
  - `getAllContent.ts` - Scans `/content` directory and returns all content with frontmatter
  - `getSiteStructure.ts` - Generates site navigation structure from content folders
- **MDX Rendering**: Uses `next-mdx-remote` for server-side MDX processing with `gray-matter` for frontmatter parsing
- **Search**: Powered by FlexSearch, searches titles, summaries, tags, and sections
- **TypeScript Paths**: Configured with `@/*` for `src/` and `@/content/*` for `content/`

### Content Structure

- `/content/` - All content as MDX files
  - `/essays/`, `/memos/`, `/vignettes/`, `/notebooks/` - Section folders containing individual posts
  - Top-level `.mdx` files become standalone pages
  - `meditations.mdx` - Special handling as living list
- Dynamic sections: Any new folder in `/content` automatically becomes a navigable section

### Routing Logic

1. Root (`/`) - Homepage with profile, recent content, and navigation
2. Single segment (`/section`) - Section listing page OR top-level page
3. Two segments (`/section/post`) - Individual post page with TOC, metadata, and related content

### Content Features

- **Frontmatter**: `title`, `date`, `summary`, `tags`, `readTime`, `published`
- **Auto-generated**: Reading time calculation, file modification dates, table of contents
- **Related Content**: Shows related posts by matching tags within same section
- **SEO**: Auto-generated meta tags, Open Graph, and canonical URLs

### Components

- `BreadcrumbsServer.tsx` - Generates navigation from content structure
- `BreadcrumbsClient.tsx` - Client-side breadcrumb navigation
- `Footer.tsx` - Site footer
- `SubstackEmbed.tsx` - Custom component for newsletter embedding

## Content Management

When adding new content:
1. Create `.mdx` file in appropriate `/content` subfolder
2. Include proper frontmatter with at least `title` and `published: true`
3. Navigation and section pages update automatically
4. Use `published: false` for drafts (accessible by direct URL only)

## External Links

External navigation links are added in `src/app/components/BreadcrumbsServer.tsx:19` (currently includes Newsletter link).

## Design Philosophy

This site follows a **primarily text-based design philosophy**:

- **Minimal Visual Elements**: Avoid unnecessary cards, boxes, gradients, or heavy styling
- **Text-First Approach**: Use typography, spacing, and simple borders for hierarchy
- **Clean Typography**: Rely on font weights, sizes, and color contrast for visual distinction
- **Subtle Interactions**: Simple hover effects and minimal animations only
- **Semantic HTML**: Use proper heading structure and semantic elements
- **Responsive Text**: Ensure readability across all devices without complex layouts

When making design changes:
- Prefer well-structured text over visual components
- Use CSS for spacing and typography, not decorative elements
- Keep interfaces scannable and uncluttered
- Maintain consistency with existing minimal aesthetic

## Testing

No specific test framework is configured - check with the user before assuming testing approach.