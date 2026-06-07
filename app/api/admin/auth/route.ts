// app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// Simple in-module token store — no external imports that could
// accidentally re-export and confuse the Next.js route checker
const TOKENS = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const adminPw  = process.env.ADMIN_PASSWORD ?? 'jpredict-admin'
    const expected = createHash('sha256').update(adminPw).digest('hex')
    const provided  = createHash('sha256').update(password).digest('hex')

    if (expected !== provided) {
      await new Promise(r => setTimeout(r, 500))
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = randomBytes(32).toString('hex')
    TOKENS.add(token)
    setTimeout(() => TOKENS.delete(token), 8 * 60 * 60 * 1000)

    return NextResponse.json({ token, expiresIn: '8h' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
