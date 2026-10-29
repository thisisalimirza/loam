import { redirect } from "next/navigation"

/** Inbox folded into Tasks: unsorted tasks live under the "No area" filter. */
export default function Inbox() { redirect("/os/tasks?area=none") }
