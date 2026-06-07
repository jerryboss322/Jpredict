// lib/oddsApi.ts
// odds-api.io client
// Primary role: fetch ALL football fixtures for today across every league/sport,
// then attach bookmaker odds to each match in the prediction pipeline.
//
// Free tier docs: https://odds-api.io/dashboard
// Rate limit: inspect response headers; stop early if low.

const BASE = 'https://api.odds-api.io/v1'

// ── Types ────────────────────────────────────────────────────────────────────

export interface OddsFixture {
  id:          string
  homeTeam:    string
  awayTeam:    string
  competition: string
  country:     string
  utcDate:     string
  status:      string
  source:      'odds-api'
  odds?: {
    homeWin:   number | null   // 1X2 home win decimal odds
    draw:      number | null
    awayWin:   number | null
    over25:    number | null   // Over 2.5 goals
    under25:   number | null
    bttsYes:   number | null
    bttsNo:    number | null
    bookmaker: string | null   // best-odds bookmaker name
  }
}

interface CacheEntry<T> { data: T; expiresAt: number }
const CACHE = new Map<string, CacheEntry<any>>()

function cacheGet<T>(key: string): T | null {
  const e = CACHE.get(key)
  if (!e) return null
  if (Date.now() > e.expiresAt) { CACHE.delete(key); return null }
  return e.data as T
}

function cacheSet<T>(key: string, data: T, ttl: number) {
  CACHE.set(key, { data, expiresAt: Date.now() + ttl })
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept':        'application/json',
    },
    next: { revalidate: 900 },
  })

  // Log remaining quota if header present
  const remaining = res.headers.get('x-ratelimit-remaining')
  if (remaining) console.log(`[OddsAPI] Requests remaining: ${remaining}`)

  if (res.status === 401) throw new Error('odds-api.io: invalid API key')
  if (res.status === 429) throw new Error('odds-api.io: rate limit hit')
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`odds-api.io ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ── Get today's football fixtures with odds ───────────────────────────────────
// Uses the /events endpoint with sport=soccer to get ALL leagues/competitions.

export async function getAllFootballFixtures(apiKey: string): Promise<OddsFixture[]> {
  if (!apiKey) return []

  const today    = new Date().toISOString().split('T')[0]
  const cacheKey = `oddsapi:fixtures:${today}`
  const cached   = cacheGet<OddsFixture[]>(cacheKey)
  if (cached) {
    console.log(`[OddsAPI] Cache hit — ${cached.length} fixtures`)
    return cached
  }

  try {
    // Fetch all soccer events for today
    // odds-api.io supports sport filtering and date filtering
    const data = await apiFetch<{ data: any[]; meta?: any }>(
      `/events?sport=soccer&date=${today}&status=upcoming,live`,
      apiKey
    )

    const events = data?.data ?? []
    console.log(`[OddsAPI] Fetched ${events.length} raw soccer events for ${today}`)

    const fixtures: OddsFixture[] = events.map((event: any) => {
      // Normalise bookmaker odds — pick the best available
      const markets = event.markets ?? event.odds ?? {}
      const h2h     = markets?.h2h ?? markets?.['1x2'] ?? markets?.moneyline ?? {}
      const goals   = markets?.totals ?? markets?.over_under ?? {}
      const btts    = markets?.btts ?? markets?.both_teams_to_score ?? {}

      // h2h odds: [home, draw, away] or { home, draw, away }
      const parseOdds = (v: any): number | null =>
        v == null ? null : parseFloat(String(v)) || null

      let homeWin: number | null = null
      let draw:    number | null = null
      let awayWin: number | null = null

      if (Array.isArray(h2h?.outcomes)) {
        const outcomes = h2h.outcomes as any[]
        homeWin = parseOdds(outcomes[0]?.price ?? outcomes[0]?.odd)
        draw    = parseOdds(outcomes[1]?.price ?? outcomes[1]?.odd)
        awayWin = parseOdds(outcomes[2]?.price ?? outcomes[2]?.odd)
      } else if (h2h?.home !== undefined) {
        homeWin = parseOdds(h2h.home)
        draw    = parseOdds(h2h.draw)
        awayWin = parseOdds(h2h.away)
      }

      // Over/Under 2.5
      let over25:  number | null = null
      let under25: number | null = null
      if (Array.isArray(goals?.outcomes)) {
        const ou = goals.outcomes as any[]
        const overEntry  = ou.find((o: any) => String(o.name ?? o.point ?? o.line).includes('Over')  || o.name === 'Over')
        const underEntry = ou.find((o: any) => String(o.name ?? o.point ?? o.line).includes('Under') || o.name === 'Under')
        over25  = parseOdds(overEntry?.price  ?? overEntry?.odd)
        under25 = parseOdds(underEntry?.price ?? underEntry?.odd)
      }

      // BTTS
      let bttsYes: number | null = null
      let bttsNo:  number | null = null
      if (Array.isArray(btts?.outcomes)) {
        const bo = btts.outcomes as any[]
        bttsYes = parseOdds(bo.find((o: any) => /yes/i.test(o.name))?.price)
        bttsNo  = parseOdds(bo.find((o: any) => /no/i.test(o.name))?.price)
      }

      const bookmaker = event.bookmakers?.[0]?.key ?? event.source ?? null

      // Extract competition / country from nested object or flat string
      const league  = event.league  ?? event.competition ?? {}
      const compName = typeof league === 'string' ? league : (league.name ?? event.competition_name ?? 'Unknown')
      const country  = typeof league === 'object' ? (league.country ?? event.country ?? 'International') : (event.country ?? 'International')

      return {
        id:          String(event.id ?? event.fixture_id ?? Math.random()),
        homeTeam:    event.home_team  ?? event.home?.name  ?? event.teams?.home?.name  ?? 'Unknown',
        awayTeam:    event.away_team  ?? event.away?.name  ?? event.teams?.away?.name  ?? 'Unknown',
        competition: compName,
        country:     country,
        utcDate:     event.commence_time ?? event.date ?? event.fixture?.date ?? new Date().toISOString(),
        status:      event.status ?? event.fixture?.status?.short ?? 'NS',
        source:      'odds-api' as const,
        odds: { homeWin, draw, awayWin, over25, under25, bttsYes, bttsNo, bookmaker },
      }
    }).filter((f: OddsFixture) =>
      // Discard fixtures with no team names
      f.homeTeam !== 'Unknown' && f.awayTeam !== 'Unknown'
    )

    console.log(`[OddsAPI] Parsed ${fixtures.length} valid fixtures`)
    cacheSet(cacheKey, fixtures, 15 * 60_000) // 15-min cache
    return fixtures

  } catch (err: any) {
    console.error(`[OddsAPI] getAllFootballFixtures failed: ${err.message}`)
    return []
  }
}

// ── Build an odds lookup map for quick attachment to other sources ─────────────

export function buildOddsMap(
  fixtures: OddsFixture[]
): Map<string, OddsFixture['odds']> {
  const map = new Map<string, OddsFixture['odds']>()
  for (const f of fixtures) {
    // Key by normalised team names so we can match across data sources
    const key = `${normalise(f.homeTeam)}:${normalise(f.awayTeam)}`
    if (f.odds) map.set(key, f.odds)
  }
  return map
}

export function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

// ── Debug / health check ──────────────────────────────────────────────────────

export async function checkOddsApiStatus(apiKey: string): Promise<{
  connected:        boolean
  requestsRemaining: number | null
  error:            string | null
}> {
  if (!apiKey) return { connected: false, requestsRemaining: null, error: 'not_configured' }
  try {
    const res = await fetch(`${BASE}/sports`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (res.ok) {
      return {
        connected:         true,
        requestsRemaining: remaining ? parseInt(remaining, 10) : null,
        error:             null,
      }
    }
    return { connected: false, requestsRemaining: null, error: `HTTP ${res.status}` }
  } catch (err: any) {
    return { connected: false, requestsRemaining: null, error: err.message }
  }
}
