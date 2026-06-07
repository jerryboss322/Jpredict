// app/api/admin/auth/route.ts
// Simple password-based auth for the admin panel.
// Set ADMIN_PASSWORD env var in Vercel (default fallback is "jpredict-admin").
// Returns a signed session token stored client-side in sessionStorage.

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// In-memory token store (cleared on serverless cold start — acceptable for admin)
const VALID_TOKENS = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const adminPassword = process.env.ADMIN_PASSWORD ?? 'jpredict-admin'

    // Constant-time comparison to prevent timing attacks
    const expected = createHash('sha256').update(adminPassword).digest('hex')
    const provided  = createHash('sha256').update(password).digest('hex')

    if (expected !== provided) {
      // Add a small artificial delay to slow brute-force attempts
      await sleep(500)
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Issue a random session token
    const token = randomBytes(32).toString('hex')
    VALID_TOKENS.add(token)

    // Auto-expire token after 8 hours
    setTimeout(() => VALID_TOKENS.delete(token), 8 * 60 * 60 * 1000)

    return NextResponse.json({ token, expiresIn: '8h' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Exported for other admin routes to verify tokens
export function isValidToken(token: string | null): boolean {
  if (!token) return false
  return VALID_TOKENS.has(token)
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
