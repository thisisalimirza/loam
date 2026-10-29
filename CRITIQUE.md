# Loam OS — adversarial critique (prod, Oct 28 2026 ~2:45–2:55 PM EDT)

Method: Playwright signed in to https://thisisalimirza.com/os, full-page screenshots of 16 pages × 7 widths (360/390/820/1180/1366/1512/1728) in `shots/critic/` (`w<width>_os_<page>.png`), plus an automated overflow/overlap check. Read-only: I created no data.

## P0 — cross-cutting, fix before anything else
1. **Data integrity alarm: Journal shows "Entries 0 / Nothing written yet" and Today says "Today's journal · Not started"; Drafts shows 0 in every column.** Ali's Oct 28 journal entry and the "Cfhcgjk" draft are expected to exist. Spec: builder checks `loam_os` tables directly (read-only) for both rows; if they exist, the list queries are filtering them out (fix the query); if missing, find the deleting test/cleanup script and restore from Supabase PITR. Ship nothing else until confirmed.
2. **Test data is leaking into prod during this session:** "ZZT1440 Area2", "ZZT1440 proj", "ZZT1440 task1/card/captured/step two", "ZZT1440 detA", "ZZT1440 send her the poster draft" appear on Today, Tasks, Board, Areas, Review and the sidebar (data changed between my 390px and 1366px passes, so another bot was writing). Spec: e2e runs use a separate Supabase schema/project or a `is_test` flag hidden from all queries; cleanup runs in `finally`. Verify zero `ZZT%` rows after the builder's run.
3. **The global capture bar covers content at every width.** Overlaps found: Site list rows under the bar at all widths (360→1728); Settings "Sign out" hidden under it at 390; on 360/390 Site, rows also sit under the tab bar. Spec: `main` gets `padding-bottom: calc(bar height + tab bar + safe-area + 16px)`; add a 360/390 visual test that asserts the last element's bottom < bar top.
4. **Board columns run off-screen at 360/390/820 (and the "Column" add button at 1180)** with no scroll affordance. Spec: on <900px show one column at a time with a segmented control (To do · Doing · Done, with counts) and swipe; ≥900px horizontal scroll with snap and a right-edge fade. Same for Project board and Drafts board (Drafts' "Scheduled"/"Published" columns are cut off at 1366).
5. **Two "add" inputs on one page.** Tasks has an inline "Add a task. Try 'Call mom fri'…" row *and* the global "Add a task, note, or person…" bar. Drafts has "New idea + Substack + Add" *and* the bar. Spec: page-specific add is the primary; hide the global bar on pages with their own add, or make the bar contextual ("Add a task…" on Tasks, "Add an idea…" on Drafts).

## Today `/os`
- **Redundant:** "1 due today" subtitle + the task's "Today" label + the project card's next task + "Up next" list all show the same task (Up next repeats tasks already shown inside project cards: "ZZT1440 step two" appears in both). Each fact once. **P1** spec: project cards show only countdown + progress; Up next is the only task list, de-duplicated.
- **Confusing:** "If you only get to one project today, make it ZZT1440 proj." is a good nudge but has no button. **P1:** make it the hero card with one action "Start" → opens its next task.
- **Jargon/unclear:** "Pin countdown" link on one card vs "Pinned" chip on the other; "Medicine Clerkship" in Settings pins but project is "IM Rotation" — two names for one date. **P1:** one name; "Pin countdown" becomes a menu item, not inline text.
- **Layout:** at 390 the "Today's journal" card is half width and floats; on desktop it sits top-right like a widget. **P2:** make it a full-width row in the task list ("Write today's journal · 2 min") so it competes on equal footing.
- **Cold:** "Suggestions · 1 · 2 tasks have no area yet · Sort them" — the count badge "1" next to a sentence about "2" contradicts at a glance. **P1:** drop the badge; the row text is enough.
- **Missing (vision):** decisions waiting on Ali, what's scheduled to post today, one evidence item. **P2.**

## Inbox `/os/inbox`
- Contradicts DESIGN-PRINCIPLES ("Inbox left the sidebar") yet still exists and is in More. **P1:** either delete the route and redirect to Tasks?filter=no-area, or keep it and remove the Today suggestion. One place.
- "Unfiled 2" lists "ZZT1440 card" with an area pill beside it — filed and unfiled at once. **P0** bug in the filter.
- Ideas empty state "Type 'idea: …' into ⌘K" is a cold start and a syntax lesson. **P1:** show 3 suggested ideas from journal/notes ("From your journal: …") with Keep / Dismiss.

## Tasks `/os/tasks`
- **Redundant:** List/Board segmented control duplicates the Board nav item; "5 open" header duplicates "Open" section header. **P1:** remove Board from nav (Tasks = one page, two views) or remove the toggle; drop "5 open" subtitle.
- **Broken at 390:** title truncates to "Finish 20 m…" while a truncated area pill "Medical Schoo" and a delete "×" eat the row. **P0:** on <600px put area/date on a second line; hide × behind swipe (it already exists); never truncate both title and pill.
- Filter chips "All · Medical School" — no project filter, no "Due" filter. **P2.**
- "Show done" pill is styled like a filter chip but is a toggle. **P2:** move to the list's footer "Show 1 done".

## Board `/os/board`
- Eyebrow "All work" + title "Board" + subtitle "Every task across areas and projects. Press ? for shortcuts." = three lines saying one thing; shortcut hint is not a phone concept. **P1:** title only; "?" icon carries shortcuts on desktop, hidden on touch.
- "Archive done" is grey text with no button affordance and is destructive-ish. **P2:** move into column "…" menu for Done.
- "Lanes" means nothing to a first-time eye. **P1:** rename "Group by area".
- "1 open · 0 in progress" stat row repeats the column counts. **P1:** delete.
- Overflow: see P0-4.

## Areas `/os/areas` and Area detail
- List shows "NEXT Finish 20 more UWorld questions" for the area and the same task again under IM Rotation. **P1:** show next task only at project level.
- "New project" and "Manage areas" both at the top: managing belongs in Settings (principle 3). **P1:** remove "Manage areas".
- Area detail: "37days" missing space; "Medicine Clerkship" label next to "IM Rotation" (same date, two names). **P1.**
- "No people linked. Set this area on someone's page in People." — instruction instead of suggestion. **P1:** show people mentioned in this area's tasks/notes with "Link".

## Project detail `/os/projects/[id]`
- "Active · due Dec 4" + "Next step… Today" + board card "Today" — the next step shown twice. **P1:** drop the Next step card when the board is visible (or highlight that card).
- Breadcrumb + "Project" eyebrow + title: eyebrow is redundant. **P2.**
- Board overflows at 360/390/820 (P0-4). Empty "Doing"/"Done" columns waste 2/3 of the width at desktop. **P2:** collapse empty columns to slim drop targets.
- Missing: project template stages (Research: Idea→IRB→…), deadline pace ("At this pace…") which Today shows but the project page doesn't. **P1:** show pace here, not on Today.

## People `/os/people`
- "Everyone 0 / No one yet" — but tasks mention "send *her* the poster draft"; suggested-from-mentions found nobody, so the promise "Names you mention… will show up below" reads as broken. **P1:** prefill with 3 suggestions (calendar attendees, mentioned names, "Your IM attending?" from the rotation) and an explicit "Suggested" section even when empty-ish.
- "Add person" button + "Add a task, note, or person…" bar = two adds (P0-5).

## Notes `/os/notes`
- Subtitle "Markdown." is jargon. **P0 copy:** "Plans, meeting notes, things to keep."
- A test note "ZZT1440 note · Heading" visible (P0-2).
- "Reading list · Add" bolted under notes; reading is learning, belongs in Learn. **P2.**

## Drafts `/os/drafts`
- Add form (input + Substack select + Add button) wraps awkwardly in the header at 1366: button drops below the input. **P1:** single row "New idea…  [Channel ▾]  Add", or one "New draft" button that opens the editor prefilled.
- Five columns, four always empty, two cut off. **P1:** default to a list grouped by stage with counts; board as option. Show a calendar for Scheduled.
- Channel pills (Substack/X/LinkedIn/Newsletter) appear above columns as filters but look like tags. **P2:** segmented filter with "All".
- Cold: no seeds suggested from journal. **P1:** "From your journal: 2 entries could be posts" row.

## Journal `/os/journal`
- See P0-1 (entries missing).
- "New entry" and "Write today" side by side — what's the difference? **P1:** one button "Write"; it opens today's page, with "Back-date" inside.
- Search field + separate "Search" button (web-form pattern, not Apple). **P2:** search-as-you-type, no button.
- Empty state teaches a shortcut. **P2:** offer 3 prompts ("What surprised you on rounds today?").

## Weekly review `/os/review`
- "1 done · 0 journal days" then "Done this week 1" then "0 words in the journal this week" — same facts twice. **P1:** one summary line.
- "Needs a decision" heading with "Nothing overdue…" under it — a heading for an empty state. **P1:** hide empty sections (principle already stated).
- "Coming up 5" duplicates Today/Up next. **P2:** limit to next week, not today/tomorrow.

## More `/os/more` (phone)
- Lists Inbox, Drafts, Notes, People, Areas & projects, Site, Weekly review, Settings, Sign out — 9 rows, flat, no grouping; Drafts and Notes are core writing and buried. **P1:** group into Write / Build / You; move Sign out into Settings only (it's in both).

## Settings `/os/settings`
- "Sign out" hidden under capture bar at 390 (P0-3); duplicated in sidebar footer icon and More. **P2:** keep in Settings + sidebar only.
- "Smart suggestions · On" and "AI help · Working" — "Working" reads as a loading state. **P1:** "AI help · On", one row, with explanatory footnote shortened.
- Missing setup for vision features: channels (X, LinkedIn, Substack, newsletter), Edges fields, evidence specialties, PostHog/RevenueCat. **P2.**

## Site `/os/site`
- Rows overlap the capture bar at every width and the tab bar on phones (P0-3).
- At 390 each row crams title, path, type and date; titles truncate to "Newcombs Paradox a…", "Tooling a cool backend c…". **P1:** phone row = title (2 lines) + date; path/type in detail only.
- "Saving commits to GitHub and goes live in about a minute" is implementation jargon. **P1:** "Changes go live in about a minute."
- Search input + "Search" button (P2, as Journal). "50 items · 6 hidden" — "hidden" unexplained. **P2:** "6 drafts".

## Not yet built (vs VISION.md) — P2 roadmap
Schedule calendar for posts · Research pipeline template · Business metrics strip · Learn/Evidence · Edges debates · Review queue. Sidebar today has 11 items + areas; merge per VISION IA (Today/Do/Write/Build/Learn) before adding any of these, or clutter doubles.
