// lib/apiFootball.ts
// API-Football (api-sports.io) client
// Handles international fixtures, friendlies, World Cup qualifiers,
// Nations League, AFCON, Copa America — everything football-data.org misses.
// Free tier: 100 requests/day at https://v3.football.api-sports.io

const BASE = 'https://v3.football.api-sports.io'

// Cache
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

// ── Competition IDs on API-Football ──────────────────────────────────────────

export const AF_COMPETITIONS: Record<string, { id: number; name: string; country: string; type: string }> = {
  // International
  INT_FRIENDLIES:     { id: 10,   name: 'International Friendlies',     country: 'International', type: 'international' },
  WORLD_CUP:          { id: 1,    name: 'FIFA World Cup',                country: 'International', type: 'international' },
  WC_QUALIFIERS_EU:   { id: 32,   name: 'World Cup Qualifiers (Europe)', country: 'Europe',        type: 'international' },
  WC_QUALIFIERS_AF:   { id: 29,   name: 'World Cup Qualifiers (Africa)', country: 'Africa',        type: 'international' },
  WC_QUALIFIERS_AS:   { id: 30,   name: 'World Cup Qualifiers (Asia)',   country: 'Asia',          type: 'international' },
  WC_QUALIFIERS_SA:   { id: 31,   name: 'World Cup Qualifiers (S.America)', country: 'S.America',  type: 'international' },
  WC_QUALIFIERS_NA:   { id: 33,   name: 'World Cup Qualifiers (N.America)', country: 'N.America',  type: 'international' },
  UEFA_NATIONS:       { id: 5,    name: 'UEFA Nations League',           country: 'Europe',        type: 'international' },
  EURO_CHAMPS:        { id: 4,    name: 'UEFA European Championship',    country: 'Europe',        type: 'international' },
  EURO_QUALIFIERS:    { id: 960,  name: 'UEFA Euro Qualifiers',          country: 'Europe',        type: 'international' },
  AFCON:              { id: 6,    name: 'Africa Cup of Nations',         country: 'Africa',        type: 'international' },
  AFCON_QUALIFIERS:   { id: 7,    name: 'AFCON Qualifiers',              country: 'Africa',        type: 'international' },
  COPA_AMERICA:       { id: 9,    name: 'Copa America',                  country: 'S.America',     type: 'international' },
  GOLD_CUP:           { id: 16,   name: 'CONCACAF Gold Cup',             country: 'N.America',     type: 'international' },
  ASIAN_CUP:          { id: 8,    name: 'AFC Asian Cup',                 country: 'Asia',          type: 'international' },
  CLUB_FRIENDLIES:    { id: 667,  name: 'Club Friendlies',               country: 'International', type: 'friendly' },
}

// Default international competitions to fetch daily
export const DEFAULT_AF_LEAGUES = [
  'INT_FRIENDLIES',
  'WORLD_CUP',
  'WC_QUALIFIERS_EU',
  'WC_QUALIFIERS_AF',
  'WC_QUALIFIERS_AS',
  'WC_QUALIFIERS_SA',
  'WC_QUALIFIERS_NA',
  'UEFA_NATIONS',
  'EURO_QUALIFIERS',
  'AFCON',
  'AFCON_QUALIFIERS',
  'COPA_AMERICA',
  'GOLD_CUP',
  'ASIAN_CUP',
]

// ── Raw fixture shape ─────────────────────────────────────────────────────────

export interface AFFixture {
  matchApiId:    number
  homeTeamApiId: number
  awayTeamApiId: number
  homeTeam:      string
  awayTeam:      string
  homeLogo:      string
  awayLogo:      string
  competition:   string
  country:       string
  utcDate:       string
  status:        string
  source:        'api-football'
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'x-apisports-key': apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
    next: { revalidate: 900 },
  })

  // Check remaining requests
  const remaining = res.headers.get('x-ratelimit-requests-remaining')
  if (remaining) console.log(`[API-Football] Requests remaining today: ${remaining}`)

  if (res.status === 429) throw new Error('API-Football rate limit hit')
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API-Football ${res.status}: ${body}`)
  }

  const json = await res.json() as any

  // API-Football wraps errors in the response body
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`)
  }

  return json as T
}

// ── Get today's international fixtures ───────────────────────────────────────

export async function getInternationalFixtures(apiKey: string): Promise<AFFixture[]> {
  if (!apiKey) return []

  const today    = new Date().toISOString().split('T')[0]
  const cacheKey = `af:fixtures:${today}`
  const cached   = cacheGet<AFFixture[]>(cacheKey)
  if (cached) return cached

  const fixtures: AFFixture[] = []
  let requestsUsed = 0

  for (const compKey of DEFAULT_AF_LEAGUES) {
    const comp = AF_COMPETITIONS[compKey]
    if (!comp) continue

    // Stop if we've used 80 of the 100 daily requests (leave buffer)
    if (requestsUsed >= 80) {
      console.warn('[API-Football] Approaching daily limit — stopping early')
      break
    }

    try {
      const data = await apiFetch<{ response: any[] }>(
        `/fixtures?league=${comp.id}&date=${today}&status=NS-1H-HT-2H`,
        apiKey
      )
      requestsUsed++

      for (const item of data.response ?? []) {
        const f = item.fixture
        const home = item.teams?.home
        const away = item.teams?.away
        const league = item.league

        if (!home || !away || !f) continue

        fixtures.push({
          matchApiId:    f.id,
          homeTeamApiId: home.id,
          awayTeamApiId: away.id,
          homeTeam:      home.name,
          awayTeam:      away.name,
          homeLogo:      home.logo ?? '',
          awayLogo:      away.logo ?? '',
          competition:   league?.name ?? comp.name,
          country:       league?.country ?? comp.country,
          utcDate:       f.date,
          status:        f.status?.short ?? 'NS',
          source:        'api-football',
        })
      }

      await sleep(150) // polite delay
    } catch (err: any) {
      console.error(`[API-Football] ${compKey}: ${err.message}`)
    }
  }

  cacheSet(cacheKey, fixtures, 15 * 60_000) // 15 min cache
  console.log(`[API-Football] Found ${fixtures.length} international fixtures for ${today}`)
  return fixtures
}

// ── Get team stats from API-Football ─────────────────────────────────────────

export async function getTeamStatistics(
  apiKey: string,
  teamId: number,
  leagueId: number,
  season: number
): Promise<any> {
  const cacheKey = `af:stats:${teamId}:${leagueId}:${season}`
  const cached   = cacheGet<any>(cacheKey)
  if (cached) return cached

  const data = await apiFetch<{ response: any }>(
    `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
    apiKey
  )

  cacheSet(cacheKey, data.response, 30 * 60_000)
  return data.response
}

// ── Debug: check API-Football status ─────────────────────────────────────────

export async function checkApiFootballStatus(apiKey: string): Promise<{
  connected: boolean
  requestsRemaining: number | null
  error: string | null
}> {
  try {
    const res = await fetch(`${BASE}/status`, {
      headers: { 'x-apisports-key': apiKey },
    })
    const remaining = res.headers.get('x-ratelimit-requests-remaining')
    if (res.ok) {
      return { connected: true, requestsRemaining: remaining ? parseInt(remaining) : null, error: null }
    }
    return { connected: false, requestsRemaining: null, error: `HTTP ${res.status}` }
  } catch (err: any) {
    return { connected: false, requestsRemaining: null, error: err.message }
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
