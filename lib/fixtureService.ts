// backend/src/services/fixtureService.ts
// Fetches fixtures, team stats, and H2H from football-data.org.
// Uses an in-memory cache to respect the 50 req/min free tier limit.
// Inspects X-Requests-Available-Minute header as Daniel recommended.

import type { TeamStats, H2HStats, LeagueBaseline } from '@/lib/predictionEngine'
import { LEAGUE_DEFAULTS } from '@/lib/predictionEngine'

const BASE = 'https://api.football-data.org/v4'

// Cache TTLs (ms)
const TTL = {
  fixtures:  15 * 60_000,  // 15 min
  standings: 60 * 60_000,  // 60 min
  teamStats: 30 * 60_000,  // 30 min
  h2h:       60 * 60_000,  // 60 min
}

interface CacheEntry<T> { data: T; expiresAt: number }
const CACHE = new Map<string, CacheEntry<any>>()

function cacheGet<T>(key: string): T | null {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { CACHE.delete(key); return null }
  return entry.data as T
}

function cacheSet<T>(key: string, data: T, ttl: number): void {
  CACHE.set(key, { data, expiresAt: Date.now() + ttl })
}

// ── Core fetch ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json' },
  })

  // Surface rate-limit info exactly as Daniel specified
  const remaining  = res.headers.get('X-Requests-Available-Minute')
  const retryAfter = res.headers.get('Retry-After')

  if (process.env.NODE_ENV !== 'production' && remaining) {
    console.log(`[FDO] Requests left this minute: ${remaining}`)
  }

  if (res.status === 429) {
    const wait = retryAfter ? parseInt(retryAfter) : 60
    throw new Error(`Rate limited by football-data.org. Retry after ${wait}s.`)
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`football-data.org ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ── Fixture shape returned to server.ts ────────────────────────────────────

export interface RawFixture {
  matchApiId:    number
  homeTeamApiId: number
  awayTeamApiId: number
  homeTeam:      string
  awayTeam:      string
  competition:   string
  country:       string
  utcDate:       string
  status:        string
}

// ── League baseline map ─────────────────────────────────────────────────────

const LEAGUE_BASELINES: Record<string, LeagueBaseline> = {
  PL:  { avgGoals: 2.81, avgCorners: 10.8, avgCards: 3.2, homeWinRate: 0.44 },
  PD:  { avgGoals: 2.54, avgCorners: 9.4,  avgCards: 4.1, homeWinRate: 0.42 },
  BL1: { avgGoals: 3.05, avgCorners: 10.1, avgCards: 2.9, homeWinRate: 0.40 },
  SA:  { avgGoals: 2.52, avgCorners: 9.7,  avgCards: 3.8, homeWinRate: 0.43 },
  FL1: { avgGoals: 2.61, avgCorners: 9.9,  avgCards: 3.5, homeWinRate: 0.41 },
  CL:  { avgGoals: 2.73, avgCorners: 10.0, avgCards: 3.0, homeWinRate: 0.43 },
  DED: { avgGoals: 3.10, avgCorners: 10.4, avgCards: 2.8, homeWinRate: 0.45 },
  PPL: { avgGoals: 2.58, avgCorners: 9.8,  avgCards: 3.6, homeWinRate: 0.42 },
  ELC: { avgGoals: 2.48, avgCorners: 10.2, avgCards: 3.4, homeWinRate: 0.41 },
}

const COMP_COUNTRY: Record<string, string> = {
  PL: 'England', PD: 'Spain', BL1: 'Germany', SA: 'Italy', FL1: 'France',
  CL: 'Europe',  DED: 'Netherlands', PPL: 'Portugal', ELC: 'England',
}

// ── Public methods ──────────────────────────────────────────────────────────

async function getTodayFixtures(apiKey: string, leagues: string[]): Promise<RawFixture[]> {
  const today = new Date().toISOString().split('T')[0]
  const key   = `fixtures:today:${today}:${leagues.join(',')}`

  const cached = cacheGet<RawFixture[]>(key)
  if (cached) return cached

  const fixtures: RawFixture[] = []

  for (const code of leagues) {
    try {
      const data = await apiFetch<{ matches: any[] }>(
        `/competitions/${code}/matches?dateFrom=${today}&dateTo=${today}&status=SCHEDULED,TIMED`,
        apiKey
      )
      for (const m of data.matches ?? []) {
        fixtures.push({
          matchApiId:    m.id,
          homeTeamApiId: m.homeTeam.id,
          awayTeamApiId: m.awayTeam.id,
          homeTeam:      m.homeTeam.name,
          awayTeam:      m.awayTeam.name,
          competition:   m.competition?.name ?? code,
          country:       COMP_COUNTRY[code] ?? 'Unknown',
          utcDate:       m.utcDate,
          status:        m.status,
        })
      }
      // Small delay between league fetches to be polite
      await sleep(300)
    } catch (err: any) {
      console.error(`[fixtureService] Failed to fetch ${code}:`, err.message)
    }
  }

  cacheSet(key, fixtures, TTL.fixtures)
  return fixtures
}

async function getTeamStats(apiKey: string, teamApiId: number, competition: string): Promise<TeamStats> {
  const key = `teamStats:${teamApiId}`

  const cached = cacheGet<TeamStats>(key)
  if (cached) return cached

  // Fetch last 10 finished matches for this team
  const now   = new Date()
  const from  = new Date(now.getTime() - 120 * 86400_000).toISOString().split('T')[0]
  const to    = now.toISOString().split('T')[0]

  const data = await apiFetch<{ matches: any[] }>(
    `/teams/${teamApiId}/matches?dateFrom=${from}&dateTo=${to}&status=FINISHED&limit=10`,
    apiKey
  )

  const matches = (data.matches ?? [])
    .sort((a: any, b: any) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 10)

  const stats = computeTeamStats(matches, teamApiId)
  cacheSet(key, stats, TTL.teamStats)
  return stats
}

async function getH2H(apiKey: string, matchApiId: number): Promise<H2HStats> {
  const key = `h2h:${matchApiId}`

  const cached = cacheGet<H2HStats>(key)
  if (cached) return cached

  const data = await apiFetch<{ matches: any[] }>(
    `/matches/${matchApiId}/head2head?limit=10`,
    apiKey
  )

  const h2h = computeH2H(data.matches ?? [])
  cacheSet(key, h2h, TTL.h2h)
  return h2h
}

function getLeagueBaseline(competition: string): LeagueBaseline {
  // Match by name fragment or code
  for (const [code, baseline] of Object.entries(LEAGUE_BASELINES)) {
    if (competition.toLowerCase().includes(code.toLowerCase())) return baseline
  }
  return LEAGUE_DEFAULTS
}

function clearCache(): void {
  CACHE.clear()
  console.log('[fixtureService] Cache cleared')
}

// ── Stats computation ────────────────────────────────────────────────────────

function computeTeamStats(matches: any[], teamApiId: number): TeamStats {
  const n = matches.length || 1

  let wins10 = 0, draws10 = 0, losses10 = 0
  let goalsScored10 = 0, goalsConceded10 = 0
  let wins5 = 0, draws5 = 0, losses5 = 0
  let goalsScored5 = 0, goalsConceded5 = 0
  let over05 = 0, over15 = 0, over25 = 0, over35 = 0
  let btts = 0, cleanSheets = 0
  let homeWins = 0, homeGs = 0, homeGc = 0
  let awayWins = 0, awayGs = 0, awayGc = 0

  for (let i = 0; i < matches.length; i++) {
    const m      = matches[i]
    const isHome = m.homeTeam?.id === teamApiId
    const gs     = isHome ? (m.score?.fullTime?.home ?? 0) : (m.score?.fullTime?.away ?? 0)
    const gc     = isHome ? (m.score?.fullTime?.away ?? 0) : (m.score?.fullTime?.home ?? 0)
    const total  = gs + gc
    const w      = m.score?.winner

    const result = !w ? 'D'
      : (w === 'HOME_TEAM' && isHome) || (w === 'AWAY_TEAM' && !isHome) ? 'W' : 'L'

    goalsScored10   += gs
    goalsConceded10 += gc
    if (result === 'W') wins10++
    else if (result === 'D') draws10++
    else losses10++

    if (total > 0.5) over05++
    if (total > 1.5) over15++
    if (total > 2.5) over25++
    if (total > 3.5) over35++
    if (gs > 0 && gc > 0) btts++
    if (gc === 0) cleanSheets++

    if (isHome) { homeGs += gs; homeGc += gc; if (result === 'W') homeWins++ }
    else        { awayGs += gs; awayGc += gc; if (result === 'W') awayWins++ }

    if (i < 5) {
      goalsScored5   += gs
      goalsConceded5 += gc
      if (result === 'W') wins5++
      else if (result === 'D') draws5++
      else losses5++
    }
  }

  return {
    wins10, draws10, losses10,
    goalsScored10, goalsConceded10,
    wins5, draws5, losses5,
    goalsScored5, goalsConceded5,
    over05Rate:      over05 / n,
    over15Rate:      over15 / n,
    over25Rate:      over25 / n,
    over35Rate:      over35 / n,
    bttsRate:        btts / n,
    cleanSheetRate:  cleanSheets / n,
    homeWins, homeGoalsScored: homeGs, homeGoalsConceded: homeGc,
    awayWins, awayGoalsScored: awayGs, awayGoalsConceded: awayGc,
    // Corners / cards not available on free tier — fallback to league averages
    avgCornersFor: 5.1, avgCornersAgainst: 5.1, over85CornersRate: 0.50,
    avgYellow: 1.8, avgRed: 0.1, avgTotalCards: 1.9, over25CardsRate: 0.45,
    leaguePosition: 10,
  }
}

function computeH2H(matches: any[]): H2HStats {
  if (!matches.length) {
    return { totalMatches: 0, homeWins: 0, draws: 0, awayWins: 0, avgGoals: 2.65, bttsRate: 0.50 }
  }
  let homeWins = 0, draws = 0, awayWins = 0, goals = 0, btts = 0

  for (const m of matches) {
    const w = m.score?.winner
    if (!w) draws++
    else if (w === 'HOME_TEAM') homeWins++
    else awayWins++
    goals += (m.score?.fullTime?.home ?? 0) + (m.score?.fullTime?.away ?? 0)
    if ((m.score?.fullTime?.home ?? 0) > 0 && (m.score?.fullTime?.away ?? 0) > 0) btts++
  }

  return {
    totalMatches: matches.length,
    homeWins, draws, awayWins,
    avgGoals:  Math.round((goals / matches.length) * 100) / 100,
    bttsRate:  Math.round((btts  / matches.length) * 100) / 100,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export const fixtureService = {
  getTodayFixtures,
  getTeamStats,
  getH2H,
  getLeagueBaseline,
  clearCache,
}
