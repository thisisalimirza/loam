# Loam OS: a private suite behind the personal site

Proposal only. Nothing built or pushed.

## 1. What's there today (audit)
- **Stack:** Next.js 15.3 (App Router), React 19, TypeScript. Content is MDX in `/content`, rendered with `next-mdx-remote` and `gray-matter`, with FlexSearch for search. The only dependency is `@vercel/analytics`. There is no Tailwind; styling is one hand-written `globals.css`.
- **Auth:** None in the real sense. `/admin` is a client-side MDX editor. Each API route (`/api/publish|update|delete|content|sections`) compares a `password` field in the request body against `ADMIN_PASSWORD`, then commits to GitHub using `GITHUB_TOKEN`. There are no sessions, no middleware and no rate limiting. `/admin` is `noindex` and listed in robots.txt.
- **Database:** None. Data lives in files: MDX, plus `src/data/reading.json` refreshed by `scripts/fetch-reading.mjs`.
- **Design:** "Quiet Publication", a warm print look. Paper `#faf7f1`, ink `#17171b`, brick accent `#b23a20`. Fraunces for display, EB Garamond for reading, Instrument Sans for labels. 4px radius, hairline rules, no shadows, fluid type scale.
- **Deploy:** Vercel, team **braskgroup**. The likely project is `thisisalimirza` (prj_HYUNd6dO…); it is the only personal-site project in the team, but I didn't confirm the git link. Pushes to `main` deploy, and publishing from `/admin` also triggers a deploy because it commits.

## 2. Architecture
- **Routes:** everything lives under `src/app/os/` with its own `layout.tsx` (app shell, `noindex`). The public site's catch-all `[[...slug]]` never sees `/os`, because static segments win. The public site keeps its CSS and its static/ISR rendering. `/os` is dynamic and uses a scoped stylesheet.
- **Owner-only sign-in:** **Auth.js (NextAuth v5) with GitHub OAuth, allowlisted to Ali's GitHub user ID**. That's one user and no passwords. A `middleware.ts` matcher on `/os/:path*` and `/api/os/:path*` redirects anyone without a session. Each server action also calls `requireOwner()`, so a missed matcher doesn't leak data. Later, move the old `/admin` password routes behind the same session and delete `ADMIN_PASSWORD`.
- **Data store (one pick): Supabase Postgres**, as a new project. Ali already runs Supabase for Rounds, so there's nothing new to learn and the free tier is enough. Access is server-only through the service-role client inside server actions, with RLS on and no anon policies. Use Drizzle or plain SQL migrations in `supabase/migrations`. Supabase Auth stays unused because Auth.js keeps login on GitHub; the alternative is Supabase magic link with a single allowed email, which is also fine. Store files (PDF evals, receipts) in Supabase Storage.
- **Mutations:** server actions plus `revalidatePath`. No public API.
- **Integrations:** cached server fetches (`unstable_cache`, 5–15 min). Tokens live in Vercel env vars, never in the database.

## 3. The model: building blocks, not hardcoded modules
Ali's life will change after M3, after Match, as projects start and stop. So the suite hardcodes **primitives**. "Med school", "ERAS", "Rounds" and "MDplus" are **instances** built from those primitives, usually started from a **template**.

### Primitives (one table each, all linked)
| Block | What it is | Notes |
|---|---|---|
| **Area** | An ongoing sphere of responsibility: School, Rounds, MDplus, Sitr, Health, Money | Has a color, an icon and a home page. It can be archived but never ends. |
| **Project** | Has an outcome and an end: "Surgery clerkship", "ERAS 2027", "Rounds v3 launch", "MDplus spring summit" | Belongs to an area. Choose a board, list or timeline view. Holds custom fields. |
| **Task** | The unit of action | Belongs to a project or area. Has due/scheduled date, status, recurrence, and links. |
| **Person** | Mentor, attending, letter writer, recruiter, sponsor, collaborator | Has last-touch and next-follow-up fields. Links to projects, notes and tasks. |
| **Note** | Markdown with backlinks | A doc or meeting note. Can also be promoted to a Draft. |
| **Tracker** | A user-defined collection with a typed schema (text, number, date, select, person, file, rating) | Covers ERAS programs, evaluations, shelf scores, subscriptions, habits, reading and sponsors. Views: table, board, calendar or chart. |
| **Journal entry** | Private, dated, free writing. Can be promoted to a **Draft** | See "Journal" below. |
| **Draft** | A piece of outgoing content with a channel and status | Channels: Substack, X, LinkedIn, newsletter, essay (site). |
| **Review** | A recurring checklist plus prompts over a saved query | Daily shutdown, weekly review, monthly money check. |
| **Event/date** | A dated item, from Google Calendar or local | Shelf exams, deadlines and conference dates. Feeds countdowns. |

Every object has `area_id`, `tags`, `links[]` (any to any), and `fields jsonb` validated by the tracker or project schema. That keeps the schema to a handful of core tables, and adding a new life domain takes no code.

### Journal (v1)
A calm, fast place to think out loud. Most entries go nowhere, and that is fine.
- **Writing:** opens straight into a blank page dated today. Full-screen, EB Garamond at reading size on paper, no toolbar, Markdown shortcuts only. Autosaves every keystroke to the database (local draft first, so it works on a bad hospital connection). `⌘J` opens it from anywhere; on mobile it's one tap from the tab bar.
- **Optional metadata:** a mood or energy tag, area, and free tags. All of these are hidden until asked for.
- **Rereading:** a quiet reverse-chronological stream, "On this day" (1 month, 1 year ago), full-text search, and a highlight action that saves a line as a seed.
- **Promote to draft:** turns an entry, or a selected passage, into a **Draft** linked back to its source. Choose a channel: Substack, X, LinkedIn, Newsletter, or Essay (the existing MDX publish flow). One entry can spawn several drafts.
- **Pipeline:** drafts move Idea → Drafting → Ready → Scheduled → Published (with URL and date) → Archived, on a board view reusing the Kanban. Each channel adds light rules, such as a 280-char counter and thread splitter for X, and a ~3,000-char guide for LinkedIn.
- **v1 scope:** writing, rereading, promoting, and status tracking. Publishing stays manual: copy out, then paste the URL back. "Essay" reuses the existing GitHub publish route.
- **Later:** post directly through the X and LinkedIn APIs, Substack import of published URLs, newsletter send via Resend, and a weekly review prompt that surfaces unpromoted entries worth developing.
- **Privacy:** entries stay private by default. Nothing reaches the public site unless he explicitly publishes an Essay.

### Fixed surfaces (the only built-in screens)
- **Today** (v1): a one-line journal prompt or a link to today's entry; agenda, due and scheduled tasks across all areas, countdown chips for pinned dates, follow-ups due, and the habit tracker's checkboxes if one is pinned. Quick capture with `⌘K`.
- **Areas** and **Projects** (v1): each with a home page and a board view ported from the Rounds Kanban (`app/admin/board/Board.tsx`, @dnd-kit).
- **Inbox** (v1): anything captured without a home.
- **People** (v1.5), **Notes** and **Journal + Drafts** (v1), **Trackers** (v1.5: schema editor plus views), **Reviews** (v2).
- **Overview** (v2): integration cards (section 4).

### Templates (seed data, editable, deletable)
Templates are JSON in the repo. They create an area or project plus trackers, saved views and recurring tasks. Starters for Ali:
- **Clerkship rotation:** project with dates, site and attending; evaluation tracker row; shelf date; study-block tracker.
- **Residency application (ERAS):** programs tracker (stage board), letters tracker linked to People, personal-statement note, timeline to the ~June 2027 opening.
- **Product:** area with a roadmap board, launch checklist and a metrics card slot. Use it for Rounds, Sitr and Loam.
- **Community/org:** events project template plus a sponsors tracker linked to People (MDplus).
- **Life trackers:** subscriptions (cost, renewal date, "still need?"; this tracks the goal of dropping paid software), habits, reading list (can sync to the public `reading.json`).

After residency, Ali archives the School area and applies a "Residency program" template. Nothing has to be rebuilt.

### Paid tools the primitives could replace (candidates)
- Tasks and boards: Todoist, Things, Linear-for-one, Notion task databases.
- Notes: Notion, Obsidian Sync, Bear.
- Journal and Drafts: Day One, Reflect, Typefully or Hypefury-style post schedulers (for drafting only).
- People: Clay, Dex, Folk.
- Trackers: Airtable or Notion databases, paid residency trackers, Streaks, Habitify, Rocket Money-style subscription trackers.
- Today and Reviews: Sunsama, Akiflow.

## 4. Integrations
| Integration | Shows | When |
|---|---|---|
| Google Calendar | Today's events (read-only, OAuth with a refresh token in env) | v1 |
| GitHub | Open PRs/issues and last commits across Rounds, Loam, Sitr | v2 |
| Vercel | Latest deployment status per project (braskgroup) | v2 |
| Stripe | Rounds MRR, new subs, failed payments (restricted read key) | v2 |
| RevenueCat / PostHog | iOS revenue, DAU for Rounds | later |
All of these render on an **Overview** page modeled on Rounds' admin Overview.

## 5. Design direction
- **Same brand, working register.** Keep the paper, ink and brick palette, plus Instrument Sans for everything in the UI. Fraunces only for page titles and the Today date; EB Garamond only in the Journal editor and reader. Data is dense but calm: hairline rules over cards, 4px radius, no shadows, and a single accent used only for the primary action and the "due today" state.
- **Port the Rounds UI kit, not its look:** `PageHeader`, `Card`, `Pill`, `FilterBar`, `Table`, `Notice`, `EmptyState` and the button and control classes from `components/admin/ui.tsx`. Re-skin them with Loam tokens in plain CSS modules, since adding Tailwind to the whole site isn't worth it. Pill tones map to areas (Rounds, MDplus, School…).
- **Shell:** left sidebar on desktop; on mobile, a bottom tab bar (Today · Journal · Inbox · Areas · More; pinned areas appear in the sidebar, not in the code). Sticky quick-capture. Tables collapse to stacked rows under 640px, and the Kanban scrolls columns *inside* its own container with snap. Set `overflow-x: clip` on the shell so there's no page-level horizontal scroll, and test at 360px.
- **Copy:** short and literal ("3 due", "Shelf in 12 days"). No greetings, no exclamation marks, no filler empty states.
- **Permissions:** skip roles. Borrow only the Rounds idea that every guard is a named server-side function (`requireOwner()`). That leaves a clean hook if a VA or teammate ever needs scoped access later.

## 6. Build order
1. **Phase 0 (one evening):** Auth.js plus middleware, the `/os` shell, Supabase project and core schema (areas, projects, tasks, people, notes, journal_entries, drafts, links), ported UI kit, mobile nav. Ship it locked and empty.
2. **Phase 1 (v1):**
   - **People (moved up from Phase 2):** each person has a page with a log of conversations (date, how you talked, what you covered, what they're up to, follow-ups), plus a short recap of your last conversation shown at the top before your next one. Quick-log a conversation from Today or from ⌘K. Tasks with list and board, Areas, Projects, Inbox and quick capture, Notes with backlinks, **Journal with promote-to-draft and the draft status board**, Today with Google Calendar. Hand-create School, Rounds and MDplus as areas. Ali should be able to use it daily from here.
3. **Phase 2:** People, generic Trackers (schema editor plus table and board views), the template system with the starters above, and moving `/admin` onto the session.
4. **Phase 3:** Reviews (recurring checklists over saved queries), Overview integrations, a weekly review email via Resend. Apply the ERAS template by ~Feb 2027.
5. **Later:** calendar and chart views for trackers, syncing the reading tracker to the public shelf, a subscription-renewal digest.

## 7. Open questions for Ali
1. Do you want GitHub sign-in, or email magic link so you can log in on hospital machines without GitHub?
2. A new Supabase project, or a separate schema in an existing one?
3. Which paid tool should go first? That decides whether Tasks, Notes or Trackers gets the most polish in v1.
4. Should Google Calendar be the source of truth for dates, or should the suite own them and push them to the calendar?
