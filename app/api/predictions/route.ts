// app/api/predictions/route.ts
// Multi-sport prediction pipeline:
//
//   Source 1 — odds-api.io     : ALL sports + ALL football leagues (active only)
//   Source 2 — football-data.org: domestic leagues + UCL/UEL (stats enrichment)
//   Source 3 — api-football    : internationals, WC qualifiers, friendlies
//
// Non-football fixtures from odds-api.io go straight through multiSportEngine.
// Football fixtures are enriched with real team stats then fed into
// the main JPredict football engine.

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import {
  generateMatchPrediction,
  defaultStats,
  defaultH2H,
  LEAGUE_DEFAULTS,
  type MatchPrediction,
} from '@/lib/predictionEngine'
import { generateNonFootballPrediction } from '@/lib/multiSportEngine'
import { fixtureService } from '@/lib/fixtureService'
import { getInternationalFixtures, type AFFixture } from '@/lib/apiFootball'
import {
  getAllFixtures,
  buildOddsMap,
  normalise,
  type OddsFixture,
} from '@/lib/oddsApi'

export const revalidate = 900

interface UnifiedFootballFixture {
  matchApiId:    string | number
  homeTeamApiId: number
  awayTeamApiId: number
  homeTeam:      string
  awayTeam:      string
  competition:   string
  country:       string
  utcDate:       string
  status:        string
  source:        'fdo' | 'api-football' | 'odds-api'
  odds?:         OddsFixture['odds']
}

export async function GET() {
  const cfg = getConfig()

  if (!cfg.apiKey && !cfg.apiFootballKey && !cfg.oddsApiKey) {
    return NextResponse.json(
      { error: 'No API keys configured.', predictions: [] },
      { status: 503 }
    )
  }

  try {
    // 1. Fetch all sources in parallel
    const [fdoFixtures, intlFixtures, allOddsFixtures] = await Promise.all([
      cfg.apiKey
        ? fixtureService.getTodayFixtures(cfg.apiKey, cfg.activeLeagues)
            .catch(e => { console.error('[FDO]', e.message); return [] })
        : [],

      cfg.apiFootballKey
        ? getInternationalFixtures(cfg.apiFootballKey)
            .catch(e => { console.error('[AF]', e.message); return [] })
        : [],

      cfg.oddsApiKey
        ? getAllFixtures(cfg.oddsApiKey)
            .catch(e => { console.error('[OddsAPI]', e.message); return [] })
        : [],
    ])

    // Split by sport
    const footballOdds = allOddsFixtures.filter(f => f.sport === 'football')
    const otherSports  = allOddsFixtures.filter(f => f.sport !== 'football')
    const oddsMap      = buildOddsMap(footballOdds)

    // 2. Non-football predictions — direct from odds model
    const nonFootballPredictions = otherSports.map(f => generateNonFootballPrediction(f))

    // 3. Merge & deduplicate football fixtures
    const seen = new Set<string>()
    const footballFixtures: UnifiedFootballFixture[] = []
    const dedupeKey = (home: string, away: string, date: string) =>
      `${normalise(home)}:${normalise(away)}:${date.split('T')[0]}`

    for (const f of footballOdds) {
      const k = dedupeKey(f.homeTeam, f.awayTeam, f.utcDate)
      if (seen.has(k)) continue
      seen.add(k)
      footballFixtures.push({
        matchApiId: f.id, homeTeamApiId: 0, awayTeamApiId: 0,
        homeTeam: f.homeTeam, awayTeam: f.awayTeam,
        competition: f.competition, country: f.country,
        utcDate: f.utcDate, status: f.status, source: 'odds-api', odds: f.odds,
      })
    }

    for (const f of fdoFixtures) {
      const k = dedupeKey(f.homeTeam, f.awayTeam, f.utcDate)
      if (!seen.has(k)) {
        seen.add(k)
        footballFixtures.push({
          ...f, source: 'fdo',
          odds: oddsMap.get(`${normalise(f.homeTeam)}:${normalise(f.awayTeam)}`),
        })
      } else {
        const existing = footballFixtures.find(x => dedupeKey(x.homeTeam, x.awayTeam, x.utcDate) === k)
        if (existing) {
          existing.homeTeamApiId = (f as any).homeTeamApiId ?? 0
          existing.awayTeamApiId = (f as any).awayTeamApiId ?? 0
          existing.matchApiId    = (f as any).matchApiId ?? existing.matchApiId
          existing.source        = 'fdo'
        }
      }
    }

    for (const f of intlFixtures as AFFixture[]) {
      const k = dedupeKey(f.homeTeam, f.awayTeam, f.utcDate)
      if (seen.has(k)) continue
      seen.add(k)
      footballFixtures.push({
        matchApiId: f.matchApiId, homeTeamApiId: f.homeTeamApiId, awayTeamApiId: f.awayTeamApiId,
        homeTeam: f.homeTeam, awayTeam: f.awayTeam, competition: f.competition,
        country: f.country, utcDate: f.utcDate, status: f.status,
        source: 'api-football',
        odds: oddsMap.get(`${normalise(f.homeTeam)}:${normalise(f.awayTeam)}`),
      })
    }

    // 4. Football predictions
    const footballPredictions: (MatchPrediction & { odds?: OddsFixture['odds'] | null })[] =
      await Promise.all(
        footballFixtures.map(async fixture => {
          const canFetchStats = fixture.source === 'fdo' && cfg.apiKey && fixture.homeTeamApiId > 0
          const league = fixtureService.getLeagueBaseline(fixture.competition) ?? LEAGUE_DEFAULTS
          const [homeStats, awayStats, h2h] = canFetchStats
            ? await Promise.all([
                fixtureService.getTeamStats(cfg.apiKey, fixture.homeTeamApiId, fixture.competition).catch(() => defaultStats()),
                fixtureService.getTeamStats(cfg.apiKey, fixture.awayTeamApiId, fixture.competition).catch(() => defaultStats()),
                fixtureService.getH2H(cfg.apiKey, String(fixture.matchApiId)).catch(() => defaultH2H()),
              ])
            : [defaultStats(), defaultStats(), defaultH2H()]

          try {
            const prediction = generateMatchPrediction(
              { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
                competition: fixture.competition, country: fixture.country,
                utcDate: fixture.utcDate, homeStats, awayStats, h2h, league },
              cfg.minConfidence
            )
            return { ...prediction, odds: fixture.odds ?? null }
          } catch {
            const prediction = generateMatchPrediction(
              { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
                competition: fixture.competition, country: fixture.country,
                utcDate: fixture.utcDate,
                homeStats: defaultStats(), awayStats: defaultStats(),
                h2h: defaultH2H(), league: LEAGUE_DEFAULTS },
              cfg.minConfidence
            )
            return { ...prediction, odds: fixture.odds ?? null }
          }
        })
      )

    // 5. Merge all sports, sort by confidence
    const allPredictions = [
      ...footballPredictions,
      ...nonFootballPredictions,
    ].sort((a, b) =>
      (b.predictions[0]?.confidence ?? 0) - (a.predictions[0]?.confidence ?? 0)
    )

    return NextResponse.json({
      predictions: allPredictions,
      generatedAt: new Date().toISOString(),
      sources: {
        oddsApi: { football: footballOdds.length, otherSports: otherSports.length },
        footballDataOrg: fdoFixtures.length,
        apiFootball: intlFixtures.length,
        total: allPredictions.length,
      },
    })
  } catch (err: any) {
    console.error('[/api/predictions]', err)
    return NextResponse.json({ error: err.message, predictions: [] }, { status: 500 })
  }
}
