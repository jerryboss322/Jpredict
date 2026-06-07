// app/api/debug/route.ts
import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import { checkApiFootballStatus } from '@/lib/apiFootball'
import { checkOddsApiStatus } from '@/lib/oddsApi'

export async function GET() {
  const cfg = getConfig()

  // ── football-data.org ─────────────────────────────────────────────────────
  let fdoStatus = 'not_configured'
  let fdoFixturesToday = 0
  let fdoError = ''

  if (cfg.apiKey) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${today}&dateTo=${today}`,
        { headers: { 'X-Auth-Token': cfg.apiKey } }
      )
      if (res.ok) {
        const data = await res.json()
        fdoFixturesToday = data.matches?.length ?? 0
        fdoStatus = 'connected'
      } else {
        fdoStatus = `error_${res.status}`
        fdoError = await res.text()
      }
    } catch (e: any) {
      fdoStatus = 'fetch_failed'
      fdoError = e.message
    }
  }

  // ── API-Football ──────────────────────────────────────────────────────────
  const afStatus = cfg.apiFootballKey
    ? await checkApiFootballStatus(cfg.apiFootballKey)
    : { connected: false, requestsRemaining: null, error: 'not_configured' }

  // ── odds-api.io ───────────────────────────────────────────────────────────
  const oddsStatus = cfg.oddsApiKey
    ? await checkOddsApiStatus(cfg.oddsApiKey)
    : { connected: false, requestsRemaining: null, error: 'not_configured' }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    footballDataOrg: {
      apiKey:          cfg.apiKey ? `***${cfg.apiKey.slice(-4)}` : 'NOT SET',
      status:          fdoStatus,
      plFixturesToday: fdoFixturesToday,
      error:           fdoError || null,
    },
    apiFootball: {
      apiKey:            cfg.apiFootballKey ? `***${cfg.apiFootballKey.slice(-4)}` : 'NOT SET',
      connected:         afStatus.connected,
      requestsRemaining: afStatus.requestsRemaining,
      error:             afStatus.error,
    },
    oddsApi: {
      apiKey:            cfg.oddsApiKey ? `***${cfg.oddsApiKey.slice(-4)}` : 'NOT SET',
      connected:         oddsStatus.connected,
      requestsRemaining: oddsStatus.requestsRemaining,
      error:             oddsStatus.error,
    },
    config: {
      minConfidence:  cfg.minConfidence,
      maxPredictions: cfg.maxPredictions,
      activeLeagues:  cfg.activeLeagues,
      leagueCount:    cfg.activeLeagues.length,
    },
  })
}
