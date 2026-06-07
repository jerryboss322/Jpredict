// app/api/debug/route.ts
// Visit /api/debug on your deployed app to check config health.
// Safe to leave live — it never exposes the actual token value.

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'

export async function GET() {
  const cfg = getConfig()

  // Test the token against football-data.org without burning too many requests
  let apiStatus = 'unknown'
  let apiError  = ''
  let sampleFixtures = 0

  if (cfg.apiKey) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${today}&dateTo=${today}`,
        { headers: { 'X-Auth-Token': cfg.apiKey } }
      )
      if (res.ok) {
        const data = await res.json()
        sampleFixtures = data.matches?.length ?? 0
        apiStatus = 'connected'
      } else {
        apiStatus = `error_${res.status}`
        apiError  = await res.text()
      }
    } catch (err: any) {
      apiStatus = 'fetch_failed'
      apiError  = err.message
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      apiKey:         cfg.apiKey ? `***${cfg.apiKey.slice(-4)}` : 'NOT SET ❌',
      apiKeyLength:   cfg.apiKey.length,
      minConfidence:  cfg.minConfidence,
      maxPredictions: cfg.maxPredictions,
      activeLeagues:  cfg.activeLeagues,
      leagueCount:    cfg.activeLeagues.length,
    },
    footballDataOrg: {
      status:         apiStatus,
      plFixturesToday: sampleFixtures,
      error:          apiError || null,
    },
    instructions: cfg.apiKey
      ? 'API key is set. If apiStatus is not "connected", check the key is correct.'
      : 'Set FOOTBALL_DATA_API_KEY in Vercel → Project → Settings → Environment Variables',
  })
}
