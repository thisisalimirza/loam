import "server-only"
import { generateObject, generateText } from "ai"
import type { z } from "zod"

/**
 * One door to the AI Gateway (auth via Vercel OIDC in prod). Every caller must
 * work without it: these return null on any failure or when no credentials exist.
 */
const MODEL = "openai/gpt-4.1-mini"
const enabled = () => !!(process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL)

export async function aiObject<T>(schema: z.ZodType<T>, system: string, prompt: string, ms = 8000): Promise<T | null> {
  if (!enabled()) return null
  try {
    const r = await generateObject({ model: MODEL, schema, system, prompt, abortSignal: AbortSignal.timeout(ms) })
    return r.object
  } catch (e) { console.warn("ai object failed", (e as Error).message); return null }
}

export async function aiText(system: string, prompt: string, ms = 6000): Promise<string | null> {
  if (!enabled()) return null
  try {
    const r = await generateText({ model: MODEL, system, prompt, abortSignal: AbortSignal.timeout(ms) })
    return r.text.trim() || null
  } catch (e) { console.warn("ai text failed", (e as Error).message); return null }
}

/** Live check used by Settings: a tiny real call, cached for 10 minutes. Returns a plain reason. */
let last: { at: number; ok: boolean; why: string } | null = null
export async function aiStatus(): Promise<{ ok: boolean; why: string }> {
  if (last && Date.now() - last.at < 6e5) return last
  let ok = false, why = ""
  if (!enabled()) why = "No AI credentials on the server"
  else try {
    const r = await generateText({ model: MODEL, prompt: "Reply with OK", abortSignal: AbortSignal.timeout(8000) })
    ok = !!r.text; why = ok ? "Working" : "Empty reply from AI Gateway"
  } catch (e) {
    const m = (e as Error).message || ""
    why = /credit|billing|payment/i.test(m) ? "AI Gateway needs credits or billing set up"
      : /auth|oidc|token|401|403/i.test(m) ? "AI Gateway sign-in failed (OIDC not set up)"
      : /timeout|abort/i.test(m) ? "AI Gateway timed out" : "AI Gateway error: " + m.slice(0, 80)
  }
  last = { at: Date.now(), ok, why }
  return last
}
