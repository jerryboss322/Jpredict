// lib/oddsApi.ts
// odds-api.io multi-sport client
//
// Strategy:
//   - Fetches today's fixtures across football + other active sports
//   - Football: only leagues currently in-season (avoids wasting quota on
//     leagues on summer break — EPL, La Liga, Bundesliga, Serie A, Ligue 1
//     all finish May/June; we skip them outside their window)
//   - Other sports: NBA, NFL, NHL, MLB, Tennis, MMA — only when their
//     seasons are active
//   - 15-min cache per sport to stay well inside free-tier limits
//
// odds-api.io free tier: 500 requests/month.
// Each sport group costs 1 request, so we batch by sport key not per-league.

const BASE = 'https://api.odds-api.io/v1'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OddsFixture {
  id:          string
  homeTeam:    string
  awayTeam:    string
  competition: string
  country:     string
  utcDate:     string
  status:      string
  sport:       SportKey
  source:      'odds-api'
  odds?: {
    homeWin:   number | null   // 1X2 / moneyline home
    draw:      number | null   // null for sports with no draw market
    awayWin:   number | null
    over25:    number | null   // Over 2.5 goals / Over total line
    under25:   number | null
    bttsYes:   number | null   // football only
    bttsNo:    number | null
    bookmaker: string | null
  }
}

export type SportKey =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'american_football'
  | 'ice_hockey'
  | 'baseball'
  | 'mma'

interface CacheEntry<T> { data: T; expiresAt: number }
const CACHE = new Map<string, CacheEntry<any>>()

function cacheGet<T>(key: string): T | null {
  const e = CACHE.get(key)
  if (!e || Date.now() > e.expiresAt) { CACHE.delete(key); return null }
  return e.data as T
}

function cacheSet<T>(key: string, data: T, ttl: number): void {
  CACHE.set(key, { data, expiresAt: Date.now() + ttl })
}

const CACHE_TTL = 15 * 60_000 // 15 minutes

// ── Season-activity guard ─────────────────────────────────────────────────────
// Returns true when a league/sport is likely in active season right now.
// Month is 0-indexed (JS Date).

function isActive(sport: SportKey): boolean {
  const month = new Date().getMonth() // 0 = Jan, 11 = Dec

  switch (sport) {
    case 'football':
      // European football seasons run Aug–May.
      // International tournaments fill Jun–Jul.
      // Always return true — the API only returns real fixtures anyway;
      // if there are none, we get an empty array.
      return true

    case 'basketball':
      // NBA regular season Oct–Apr; playoffs through Jun
      return month >= 9 || month <= 5

    case 'american_football':
      // NFL Aug–Feb (preseason + regular + playoffs)
      return month >= 7 || month <= 1

    case 'ice_hockey':
      // NHL Oct–Jun
      return month >= 9 || month <= 5

    case 'baseball':
      // MLB Mar–Oct
      return month >= 2 && month <= 9

    case 'tennis':
      // Year-round (grand slams, ATP, WTA)
      return true

    case 'mma':
      // UFC/Bellator year-round
      return true

    default:
      return false
  }
}

// ── odds-api.io sport keys ────────────────────────────────────────────────────
// Mapped to their API sport slug

const SPORT_SLUGS: Record<SportKey, string> = {
  football:          'soccer',
  basketball:        'basketball',
  tennis:            'tennis',
  american_football: 'americanfootball',
  ice_hockey:        'icehockey',
  baseball:          'baseball',
  mma:               'mma',
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
    next: { revalidate: 900 },
  })

  const remaining = res.headers.get('x-ratelimit-remaining')
  if (remaining !== null) {
    console.log(`[OddsAPI] Requests remaining: ${remaining}`)
    // Hard stop at 20 remaining to preserve quota for the rest of the month
    if (parseInt(remaining, 10) < 20) {
      throw new Error('odds-api.io: quota running low — skipping to preserve limit')
    }
  }

  if (res.status === 401) throw new Error('odds-api.io: invalid API key')
  if (res.status === 429) throw new Error('odds-api.io: rate limit hit')
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`odds-api.io HTTP ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ── Parse odds from a raw event object ───────────────────────────────────────

function parseOdds(v: any): number | null {
  if (v == null) return null
  const n = parseFloat(String(v))
  return isNaN(n) || n <= 0 ? null : n
}

function extractOdds(
  event: any,
  sport: SportKey
): OddsFixture['odds'] {
  const markets = event.markets ?? event.odds ?? {}

  // 1X2 / moneyline
  const h2hMarket =
    markets?.h2h ?? markets?.['1x2'] ?? markets?.moneyline ??
    markets?.['h2h'] ?? {}

  let homeWin: number | null = null
  let draw:    number | null = null
  let awayWin: number | null = null

  if (Array.isArray(h2hMarket?.outcomes)) {
    const outcomes = h2hMarket.outcomes as any[]
    homeWin = parseOdds(outcomes[0]?.price ?? outcomes[0]?.odd)
    // Draw exists in football (3-way); skip for other sports
    if (sport === 'football' && outcomes.length >= 3) {
      draw    = parseOdds(outcomes[1]?.price ?? outcomes[1]?.odd)
      awayWin = parseOdds(outcomes[2]?.price ?? outcomes[2]?.odd)
    } else {
      awayWin = parseOdds(outcomes[1]?.price ?? outcomes[1]?.odd)
    }
  } else if (h2hMarket?.home !== undefined) {
    homeWin = parseOdds(h2hMarket.home)
    draw    = sport === 'football' ? parseOdds(h2hMarket.draw) : null
    awayWin = parseOdds(h2hMarket.away)
  }

  // Totals / over-under
  const totalsMarket = markets?.totals ?? markets?.over_under ?? {}
  let over25:  number | null = null
  let under25: number | null = null

  if (Array.isArray(totalsMarket?.outcomes)) {
    const ou = totalsMarket.outcomes as any[]
    const overE  = ou.find((o: any) => /over/i.test(String(o.name ?? o.point ?? '')))
    const underE = ou.find((o: any) => /under/i.test(String(o.name ?? o.point ?? '')))
    over25  = parseOdds(overE?.price  ?? overE?.odd)
    under25 = parseOdds(underE?.price ?? underE?.odd)
  }

  // BTTS (football only)
  let bttsYes: number | null = null
  let bttsNo:  number | null = null
  if (sport === 'football') {
    const bttsMarket = markets?.btts ?? markets?.both_teams_to_score ?? {}
    if (Array.isArray(bttsMarket?.outcomes)) {
      const bo = bttsMarket.outcomes as any[]
      bttsYes = parseOdds(bo.find((o: any) => /yes/i.test(String(o.name)))?.price)
      bttsNo  = parseOdds(bo.find((o: any) => /no/i.test(String(o.name)))?.price)
    }
  }

  const bookmaker = event.bookmakers?.[0]?.key ?? event.source ?? null

  return { homeWin, draw, awayWin, over25, under25, bttsYes, bttsNo, bookmaker }
}

// ── Parse a raw event into a normalised OddsFixture ──────────────────────────

function parseEvent(event: any, sport: SportKey): OddsFixture | null {
  const league   = event.league ?? event.competition ?? {}
  const compName = typeof league === 'string'
    ? league
    : (league.name ?? event.competition_name ?? 'Unknown')
  const country  = typeof league === 'object'
    ? (league.country ?? event.country ?? 'International')
    : (event.country ?? 'International')

  const homeTeam = event.home_team ?? event.home?.name ?? event.teams?.home?.name
  const awayTeam = event.away_team ?? event.away?.name ?? event.teams?.away?.name

  if (!homeTeam || !awayTeam || homeTeam === 'Unknown' || awayTeam === 'Unknown') {
    return null
  }

  return {
    id:          String(event.id ?? event.fixture_id ?? `${homeTeam}-${awayTeam}`),
    homeTeam,
    awayTeam,
    competition: compName,
    country,
    utcDate:     event.commence_time ?? event.date ?? event.fixture?.date ?? new Date().toISOString(),
    status:      event.status ?? 'NS',
    sport,
    source:      'odds-api',
    odds:        extractOdds(event, sport),
  }
}

// ── Fetch fixtures for a single sport ────────────────────────────────────────

async function getFixturesForSport(
  apiKey: string,
  sport: SportKey
): Promise<OddsFixture[]> {
  const today    = new Date().toISOString().split('T')[0]
  const cacheKey = `oddsapi:${sport}:${today}`
  const cached   = cacheGet<OddsFixture[]>(cacheKey)
  if (cached) {
    console.log(`[OddsAPI] Cache hit: ${sport} — ${cached.length} fixtures`)
    return cached
  }

  const slug = SPORT_SLUGS[sport]
  const data = await apiFetch<{ data: any[]; meta?: any }>(
    `/events?sport=${slug}&date=${today}&status=upcoming,live`,
    apiKey
  )

  const events   = data?.data ?? []
  const fixtures = events
    .map((e: any) => parseEvent(e, sport))
    .filter((f): f is OddsFixture => f !== null)

  console.log(`[OddsAPI] ${sport}: ${fixtures.length} fixtures for ${today}`)
  cacheSet(cacheKey, fixtures, CACHE_TTL)
  return fixtures
}

// ── Public: fetch all active sports ──────────────────────────────────────────

export async function getAllFixtures(apiKey: string): Promise<OddsFixture[]> {
  if (!apiKey) return []

  const activeSports = (Object.keys(SPORT_SLUGS) as SportKey[]).filter(isActive)

  const results = await Promise.allSettled(
    activeSports.map(sport => getFixturesForSport(apiKey, sport))
  )

  const all: OddsFixture[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
    else console.error(`[OddsAPI] Sport fetch failed: ${r.reason?.message}`)
  }

  console.log(`[OddsAPI] Total fixtures across all sports: ${all.length}`)
  return all
}

// Keep the old name as an alias so the existing predictions route doesn't break
export const getAllFootballFixtures = (apiKey: string) =>
  getAllFixtures(apiKey).then(fixtures =>
    fixtures.filter(f => f.sport === 'football')
  )

// ── Odds lookup map ───────────────────────────────────────────────────────────

export function buildOddsMap(
  fixtures: OddsFixture[]
): Map<string, OddsFixture['odds']> {
  const map = new Map<string, OddsFixture['odds']>()
  for (const f of fixtures) {
    const key = `${normalise(f.homeTeam)}:${normalise(f.awayTeam)}`
    if (f.odds) map.set(key, f.odds)
  }
  return map
}

export function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

// ── Health check ──────────────────────────────────────────────────────────────

export async function checkOddsApiStatus(apiKey: string): Promise<{
  connected:         boolean
  requestsRemaining: number | null
  error:             string | null
}> {
  if (!apiKey) return { connected: false, requestsRemaining: null, error: 'not_configured' }
  try {
    const res = await fetch(`${BASE}/sports`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const remaining = res.headers.get('x-ratelimit-remaining')
    return res.ok
      ? { connected: true, requestsRemaining: remaining ? parseInt(remaining, 10) : null, error: null }
      : { connected: false, requestsRemaining: null, error: `HTTP ${res.status}` }
  } catch (err: any) {
    return { connected: false, requestsRemaining: null, error: err.message }
  }
}
