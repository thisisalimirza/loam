# Loam OS — target vision

One private place where Ali **does** (tasks), **makes** (writing + publishing), **builds** (businesses + research) and **learns** (evidence + debates). It should feel like five Apple apps that share one database, not one app with forty tabs.

## Principles carried forward
1–3 actions per page · each fact once · setup only in Settings · no cold starts · everything editable · the app files things for you (people, dates, sources) as confirmable suggestions · nudge with a reason, max 3 on Today · plain words.

## Information architecture: 4 spaces + Today

Navigation (sidebar on desktop, 5-tab bar on phone):

| Tab | Space | What lives here | Replaces / merges |
|---|---|---|---|
| **Today** | — | Morning brief: up to 3 nudges, today's tasks, decisions waiting on you, what's scheduled to post, one "worth reading" item. | Today, Inbox, Weekly review entry point |
| **Do** | Tasks | List / Board (one page, view switch), projects and areas as filters. | Tasks, Board, Areas list |
| **Write** | Content | Journal, Notes, Drafts pipeline, Schedule calendar for LinkedIn/X/Substack/Newsletter, Site posts. | Journal, Notes, Drafts, Site |
| **Build** | Projects | Projects grouped by kind: Business (Rounds, MDplus), Research (pipeline), School. Each project uses a template with its own stages. | Areas detail, Projects |
| **Learn** | Knowledge | Evidence feed (practice-changing), Edges (live debates), Review queue (things you got wrong), Reading list. | Reading list |

People and Settings live under the avatar / "More" — they are supporting, not daily work. Search/capture bar (⌘K) is global and the only "add" entry outside page-primary buttons.

### Cross-links (the glue)
- Anything can become a **seed** → Draft (journal entry, note, Edges debate, evidence item).
- Anything can produce a **task** (draft "Ready" → "Schedule it" task; research stage → next-step task).
- **People** are auto-suggested from mentions everywhere (co-authors, mentors, debate voices on X).
- Dates found anywhere become pinned countdowns (abstract deadline, shelf exam, launch).

## Page list

| Page | Route | Primary actions (≤3) |
|---|---|---|
| Today | /os | Do the top task · Approve a decision · Write today's journal |
| Do – Tasks | /os/tasks (view=list\|board) | Add task · Switch view · Filter by area/project |
| Task detail (panel) | — | Edit · Complete · Make it a project |
| Write – home | /os/write | New entry · Continue draft · Open schedule |
| Journal | /os/write/journal | Write today · Turn into a post |
| Notes | /os/write/notes | New note · Search |
| Drafts | /os/write/drafts | New draft · Move stage · Schedule |
| Schedule | /os/write/schedule | Drag draft onto a day · Post now · Connect channel (Settings link) |
| Draft editor | /os/write/drafts/[id] | Write · Channel variants (X thread / LinkedIn / Substack / email) · Schedule |
| Site | /os/write/site | New post · Edit post · View site |
| Build – home | /os/build | New project from template · Open project |
| Business project | /os/build/[id] | Metrics strip (PostHog/RevenueCat) · Experiments · Decision log |
| Research project | /os/build/[id] | Stage pipeline Idea→IRB→Data→Analysis→Abstract→Poster→Paper · Deadline · Co-authors |
| Learn – Evidence | /os/learn | Read today's 3 items · Save · Test me |
| Learn – Edges | /os/learn/edges | Add a field · Open a debate · Make it a post |
| Debate detail | /os/learn/edges/[id] | Exact question · Sides (claim, best evidence, who argues it with X links) · What would settle it · Refreshed date |
| Review queue | /os/learn/review | Drill misconceptions |
| Weekly review | /os/review | Decide stuck items · Plan next week |
| People | /os/people | Confirm suggested · Log a conversation · Follow up |
| Settings | /os/settings | Areas, pinned dates, connections (Calendar, X, LinkedIn, Substack, PostHog, RevenueCat), Edges fields, evidence specialties |

## Edges (Debates) design
1. **Onboarding with no cold start:** fields prefilled from his areas and history (Internal medicine, Medical education, AI in medicine, Consumer health apps, Startups/growth). Ali taps to keep, types to add.
2. **Pipeline (server cron, every 6–12h):** for each field, X search (x namespace: recent search over curated expert accounts + keywords like "RCT", "guideline", "disagree", quote-tweet density) → cluster threads by claim → LLM synthesizes: *the precise contested question*, 2–3 positions, each with strongest evidence (trial/guideline citation, verified against PubMed/DOI), and the people arguing (handles + credentials). Heat = volume × reply/quote ratio × recency.
3. **Page:** per field, 3–5 debate cards ranked by heat: question in one sentence, "Side A vs Side B" chips, "new since you last looked" dot. Detail page lists evidence and voices; actions: Save to notes, Make it a post, Follow.
4. **Trust rules:** every claim links to its source post or paper; no synthesized claim without a source; stale debates (no activity 30 days) fade out.

## Learning hub (Evidence)
Weekly sources: NEJM/JAMA/Lancet/Annals/ACP Journal Club/USPSTF/major society guideline updates, plus Edges signals. Each item: title, what changes in management (one line), strength (RCT/meta/guideline), "test me" question. Wrongly answered → Review queue.

## Social scheduler
Channels: LinkedIn, X, Substack, newsletter. Drafts have channel variants generated on request (confirm-only). Schedule calendar shows posting cadence gaps ("Nothing on LinkedIn for 9 days") as a Today nudge. Direct posting where APIs allow (X), otherwise "Post now" opens the app prefilled and logs it posted.

## Phasing
P1: merge Board into Tasks, Write space (Journal/Notes/Drafts/Site + Schedule). P2: Build templates (Research, Business w/ metrics). P3: Learn (Evidence, Edges, Review queue). P4: cross-space nudges in Today.
