// app/api/predictions/route.ts
// Three-source fixture pipeline:
//   1. odds-api.io       — ALL football fixtures globally (primary, broadest coverage)
//   2. football-data.org — domestic leagues + UCL/UEL/UECL (enriches team stats)
//   3. API-Football      — international fixtures, friendlies, WC qualifiers

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import {
  generateMatchPrediction,
  defaultStats,
  defaultH2H,
  LEAGUE_DEFAULTS,
  type MatchPrediction,
} from '@/lib/predictionEngine'
import { fixtureService } from '@/lib/fixtureService'
import { getInternationalFixtures, type AFFixture } from '@/lib/apiFootball'
import {
  getAllFootballFixtures,
  buildOddsMap,
  normalise,
  type OddsFixture,
} from '@/lib/oddsApi'

export const revalidate = 900

// Unified fixture shape for the pipeline
interface UnifiedFixture {
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

  const hasAnyKey = cfg.apiKey || cfg.apiFootballKey || cfg.oddsApiKey
  if (!hasAnyKey) {
    return NextResponse.json(
      { error: 'No API keys configured.', predictions: [] },
      { status: 503 }
    )
  }

  try {
    // ── 1. Fetch all three sources in parallel ──────────────────────────────
    const [fdoFixtures, intlFixtures, oddsFixtures] = await Promise.all([
      cfg.apiKey
        ? fixtureService.getTodayFixtures(cfg.apiKey, cfg.activeLeagues)
            .catch((e) => { console.error('[FDO]', e.message); return [] })
        : Promise.resolve([]),

      cfg.apiFootballKey
        ? getInternationalFixtures(cfg.apiFootballKey)
            .catch((e) => { console.error('[AF]', e.message); return [] })
        : Promise.resolve([]),

      cfg.oddsApiKey
        ? getAllFootballFixtures(cfg.oddsApiKey)
            .catch((e) => { console.error('[OddsAPI]', e.message); return [] })
        : Promise.resolve([]),
    ])

    // ── 2. Build odds lookup map (keyed by normalised team names) ───────────
    const oddsMap = buildOddsMap(oddsFixtures)

    // ── 3. Merge and deduplicate ─────────────────────────────────────────────
    // Priority: odds-api (broadest) → fdo (enriched stats) → api-football
    const seen = new Set<string>()

    const allFixtures: UnifiedFixture[] = []

    // Helper to generate dedup key
    const key = (home: string, away: string, date: string) =>
      `${normalise(home)}:${normalise(away)}:${date.split('T')[0]}`

    // Odds-API fixtures first (most leagues)
    for (const f of oddsFixtures) {
      const k = key(f.homeTeam, f.awayTeam, f.utcDate)
      if (seen.has(k)) continue
      seen.add(k)
      allFixtures.push({
        matchApiId:    f.id,
        homeTeamApiId: 0,
        awayTeamApiId: 0,
        homeTeam:      f.homeTeam,
        awayTeam:      f.awayTeam,
        competition:   f.competition,
        country:       f.country,
        utcDate:       f.utcDate,
        status:        f.status,
        source:        'odds-api',
        odds:          f.odds,
      })
    }

    // FDO fixtures — may enrich existing OR add new ones
    for (const f of fdoFixtures) {
      const k = key(f.homeTeam, f.awayTeam, f.utcDate)
      if (!seen.has(k)) {
        seen.add(k)
        // Attach odds from odds-api if available
        const oddsKey = `${normalise(f.homeTeam)}:${normalise(f.awayTeam)}`
        allFixtures.push({
          ...f,
          source: 'fdo',
          odds:   oddsMap.get(oddsKey),
        })
      }
      // If already in list from odds-api, upgrade its apiIds for stats fetching
      else {
        const existing = allFixtures.find(x => key(x.homeTeam, x.awayTeam, x.utcDate) === k)
        if (existing) {
          existing.homeTeamApiId = (f as any).homeTeamApiId ?? 0
          existing.awayTeamApiId = (f as any).awayTeamApiId ?? 0
          existing.matchApiId    = (f as any).matchApiId    ?? existing.matchApiId
          // Upgrade source so we fetch real stats
          existing.source = 'fdo'
        }
      }
    }

    // API-Football internationals (fill in what's missing)
    for (const f of intlFixtures as AFFixture[]) {
      const k = key(f.homeTeam, f.awayTeam, f.utcDate)
      if (seen.has(k)) continue
      seen.add(k)
      const oddsKey = `${normalise(f.homeTeam)}:${normalise(f.awayTeam)}`
      allFixtures.push({
        matchApiId:    f.matchApiId,
        homeTeamApiId: f.homeTeamApiId,
        awayTeamApiId: f.awayTeamApiId,
        homeTeam:      f.homeTeam,
        awayTeam:      f.awayTeam,
        competition:   f.competition,
        country:       f.country,
        utcDate:       f.utcDate,
        status:        f.status,
        source:        'api-football',
        odds:          oddsMap.get(oddsKey),
      })
    }

    console.log(`[predictions] Total merged fixtures: ${allFixtures.length} (odds: ${oddsFixtures.length}, fdo: ${fdoFixtures.length}, intl: ${intlFixtures.length})`)

    if (allFixtures.length === 0) {
      return NextResponse.json({
        predictions: [],
        message: 'No fixtures today across all configured competitions.',
        generatedAt: new Date().toISOString(),
        sources: {
          oddsApi:        oddsFixtures.length,
          footballDataOrg: fdoFixtures.length,
          apiFootball:     intlFixtures.length,
          total:           0,
        },
      })
    }

    // ── 4. Run prediction engine on every fixture ───────────────────────────
    const predictions: (MatchPrediction & { odds?: OddsFixture['odds'] })[] =
      await Promise.all(
        allFixtures.map(async (fixture) => {
          try {
            const canFetchStats = fixture.source === 'fdo' && cfg.apiKey && fixture.homeTeamApiId > 0
            const league        = fixtureService.getLeagueBaseline(fixture.competition) ?? LEAGUE_DEFAULTS

            const [homeStats, awayStats, h2h] = canFetchStats
              ? await Promise.all([
                  fixtureService.getTeamStats(cfg.apiKey, fixture.homeTeamApiId, fixture.competition).catch(() => defaultStats()),
                  fixtureService.getTeamStats(cfg.apiKey, fixture.awayTeamApiId, fixture.competition).catch(() => defaultStats()),
                  fixtureService.getH2H(cfg.apiKey, String(fixture.matchApiId)).catch(() => defaultH2H()),
                ])
              : [defaultStats(), defaultStats(), defaultH2H()]

            const prediction = generateMatchPrediction(
              {
                homeTeam:    fixture.homeTeam,
                awayTeam:    fixture.awayTeam,
                competition: fixture.competition,
                country:     fixture.country,
                utcDate:     fixture.utcDate,
                homeStats,
                awayStats,
                h2h,
                league,
              },
              cfg.minConfidence
            )

            // Attach odds to the prediction output
            return { ...prediction, odds: fixture.odds ?? null }
          } catch (err: any) {
            console.error(`[engine] ${fixture.homeTeam} vs ${fixture.awayTeam}: ${err.message}`)
            const prediction = generateMatchPrediction(
              {
                homeTeam:    fixture.homeTeam,
                awayTeam:    fixture.awayTeam,
                competition: fixture.competition,
                country:     fixture.country,
                utcDate:     fixture.utcDate,
                homeStats:   defaultStats(),
                awayStats:   defaultStats(),
                h2h:         defaultH2H(),
                league:      LEAGUE_DEFAULTS,
              },
              cfg.minConfidence
            )
            return { ...prediction, odds: fixture.odds ?? null }
          }
        })
      )

    // Sort by top prediction confidence descending
    predictions.sort(
      (a, b) => (b.predictions[0]?.confidence ?? 0) - (a.predictions[0]?.confidence ?? 0)
    )

    return NextResponse.json({
      predictions,
      generatedAt: new Date().toISOString(),
      sources: {
        oddsApi:         oddsFixtures.length,
        footballDataOrg: fdoFixtures.length,
        apiFootball:     intlFixtures.length,
        total:           allFixtures.length,
      },
    })
  } catch (err: any) {
    console.error('[/api/predictions]', err)
    return NextResponse.json({ error: err.message, predictions: [] }, { status: 500 })
  }
}
