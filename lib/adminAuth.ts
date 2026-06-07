// lib/adminAuth.ts
// Shared in-memory token store for admin session validation.
// Tokens are issued by /api/admin/auth and validated here by protected routes.

const VALID_TOKENS = new Set<string>()

export function addToken(token: string, ttlMs: number) {
  VALID_TOKENS.add(token)
  setTimeout(() => VALID_TOKENS.delete(token), ttlMs)
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false
  return VALID_TOKENS.has(token)
}
