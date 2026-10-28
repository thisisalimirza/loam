# Loam OS design principles

Source of truth: the "Loam OS × Apple design plan" page (Apple HIG, checked 28 Oct 2026). This file is the short version for whoever edits /os next.

## Rules
1. **One page, one job.** Each page opens on its main list and has 1–3 main actions. No dashboards of counters.
2. **Each fact once.** A date, count or status appears once per page. If a project card shows its deadline, the pinned-dates row and the task list skip it.
3. **Setup lives in Settings.** Creating areas, pins and connections happens at /os/settings. Work pages are for doing work.
4. **Plain words.** "Overdue", "Follow up", "Your projects". No internal jargon ("open loops", "inbox zero", "in motion").
5. **Undo over confirm.** Completes, moves and deletes should be reversible with a toast; confirm only what can't be undone.
6. **Sheets have Cancel and Done.** Esc cancels, ⌘Enter is Done, focus stays inside and returns to the opener.
7. **Glass only on controls.** Sidebar, tab bar and toolbars are translucent; cards and rows are solid on the #F2F2F7 grouped background.
8. **44px targets, 11px minimum text**, rem sizes so zoom works, no horizontal scroll at 360px.
9. **The app does the filing.** Writing a task, note or journal entry quietly finds people (and later dates, projects, ideas). Anything it makes is shown as a suggestion with where it came from ("From your notes") until you confirm, merge or dismiss it.
10. **Nudge, don't nag.** Today shows at most three suggestions, each with a reason.

## Merges, and why
- **Inbox → Today.** Unsorted tasks are just tasks without an area; a nav item for them made you check two places. Inbox left the sidebar; Today shows "N tasks have no area yet · Sort them" only when there are some.
- **Notes + Journal (planned).** Both are writing; the goal is one place to write, with dated entries as a kind of note. Not merged yet because the journal has its own day-based flow worth keeping.

## Background enrichment
`src/lib/os/enrich.ts` runs after saves (via `after()`), matches existing people, guesses new names (heuristic + optional AI through the Vercel AI Gateway, server-only), records `loam_os.mentions`, and creates `people.status='suggested'` rows. Dismissed people are kept so they are never re-suggested.
