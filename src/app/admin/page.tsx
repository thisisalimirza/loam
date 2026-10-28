import { redirect } from "next/navigation"

// The old editor moved into Loam OS.
export default function Admin() {
  redirect("/os/site")
}
