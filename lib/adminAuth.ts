// lib/adminAuth.ts
// In-memory token store for admin sessions.
// Lives here (not in a route file) so Next.js never mistakes these functions
// for HTTP method handlers.

const VALID_TOKENS = new Set<string>()

export function addToken(token: string, ttlMs: number): void {
  VALID_TOKENS.add(token)
  setTimeout(() => VALID_TOKENS.delete(token), ttlMs)
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false
  return VALID_TOKENS.has(token)
}
