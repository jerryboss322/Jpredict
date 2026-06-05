// app/api/admin/refresh/route.ts
// Clears the in-memory API cache so the next request fetches fresh data.
// Note: on Vercel, each serverless invocation is a fresh process,
// so the cache resets automatically between cold starts anyway.

import { NextResponse } from 'next/server'
import { fixtureService } from '@/lib/fixtureService'

export async function POST() {
  fixtureService.clearCache()
  return NextResponse.json({
    message: 'Cache cleared. The next /api/predictions request will fetch fresh data from football-data.org.',
    timestamp: new Date().toISOString(),
  })
}
