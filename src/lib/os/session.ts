// Signed, httpOnly session cookie. Uses Web Crypto so it runs in middleware too.
export const SESSION_COOKIE = "loam_os"
export const SESSION_TTL = 60 * 60 * 24 * 30 // 30 days

const enc = new TextEncoder()

async function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET is missing")
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

function b64url(buf: ArrayBuffer) {
  let s = ""
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function createToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL
  const payload = `owner.${exp}`
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(payload))
  return `${payload}.${b64url(sig)}`
}

export async function verifyToken(token: string | undefined | null) {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3 || parts[0] !== "owner") return false
  const exp = Number(parts[1])
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false
  try {
    const expected = await crypto.subtle.sign("HMAC", await key(), enc.encode(`${parts[0]}.${parts[1]}`))
    const a = b64url(expected), b = parts[2]
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}
