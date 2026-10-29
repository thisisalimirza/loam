"use client"
import { useOptimistic, useTransition } from "react"
import { setAiOn } from "@/lib/os/actions"

export default function AiSwitch({ on }: { on: boolean }) {
  const [v, setV] = useOptimistic(on)
  const [, start] = useTransition()
  return (
    <button type="button" role="switch" aria-checked={v} aria-label="Suggestions" className="switch"
      onClick={() => start(async () => { setV(!v); await setAiOn(!v) })}><i /></button>
  )
}
