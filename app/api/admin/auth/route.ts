// app/api/admin/auth/route.ts
// Only exports POST — Next.js treats every named export as an HTTP handler,
// so addToken / isValidToken live in lib/adminAuth.ts instead.

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { addToken } from '@/lib/adminAuth'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const adminPassword = process.env.ADMIN_PASSWORD ?? 'jpredict-admin'

    // SHA-256 both sides so we do a constant-length comparison regardless
    const expected = createHash('sha256').update(adminPassword).digest('hex')
    const provided  = createHash('sha256').update(password).digest('hex')

    if (expected !== provided) {
      await new Promise(r => setTimeout(r, 500)) // slow brute-force attempts
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = randomBytes(32).toString('hex')
    addToken(token, SESSION_TTL_MS)

    return NextResponse.json({ token, expiresIn: '8h' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
