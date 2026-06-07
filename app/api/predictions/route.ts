// app/api/predictions/route.ts
// Merges fixtures from two sources:
//   1. football-data.org  — domestic leagues + UCL/UEL/UECL
//   2. API-Football       — international fixtures, friendlies, WC qualifiers

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import {
  generateMatchPrediction,
  defaultStats,
  defaultH2H,
  LEAGUE_DEFAULTS,
  type PredictionInput,
} from '@/lib/predictionEngine'
import { fixtureService } from '@/lib/fixtureService'
import { getInternationalFixtures, type AFFixture } from '@/lib/apiFootball'

export const revalidate = 900

export async function GET() {
  const cfg = getConfig()

  if (!cfg.apiKey && !cfg.apiFootballKey) {
    return NextResponse.json(
      { error: 'No API keys configured.', predictions: [] },
      { status: 503 }
    )
  }

  try {
    // Fetch from both sources in parallel
    const [fdoFixtures, intlFixtures] = await Promise.all([
      cfg.apiKey
        ? fixtureService.getTodayFixtures(cfg.apiKey, cfg.activeLeagues)
            .catch((e) => { console.error('[FDO]', e.message); return [] })
        : Promise.resolve([]),
      cfg.apiFootballKey
        ? getInternationalFixtures(cfg.apiFootballKey)
            .catch((e) => { console.error('[AF]', e.message); return [] })
        : Promise.resolve([]),
    ])

    // Deduplicate by team names + date
    const seen = new Set<string>()
    const allFixtures = [
      ...fdoFixtures.map(f => ({ ...f, source: 'fdo' as const })),
      ...intlFixtures.map((f: AFFixture) => ({
        matchApiId:    f.matchApiId,
        homeTeamApiId: f.homeTeamApiId,
        awayTeamApiId: f.awayTeamApiId,
        homeTeam:      f.homeTeam,
        awayTeam:      f.awayTeam,
        competition:   f.competition,
        country:       f.country,
        utcDate:       f.utcDate,
        status:        f.status,
        source:        'api-football' as const,
      })),
    ].filter(f => {
      const key = `${f.homeTeam}:${f.awayTeam}:${f.utcDate.split('T')[0]}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (allFixtures.length === 0) {
      return NextResponse.json({
        predictions: [],
        message: 'No fixtures today across all configured competitions.',
        generatedAt: new Date().toISOString(),
        sources: { footballDataOrg: fdoFixtures.length, apiFootball: intlFixtures.length },
      })
    }

    // Run prediction engine on every fixture
    const predictions = await Promise.all(
      allFixtures.map(async (fixture) => {
        try {
          const isIntl = fixture.source === 'api-football'
          const league = fixtureService.getLeagueBaseline(fixture.competition) ?? LEAGUE_DEFAULTS

          const [homeStats, awayStats, h2h] = isIntl
            ? [defaultStats(), defaultStats(), defaultH2H()]
            : await Promise.all([
                fixtureService.getTeamStats(cfg.apiKey, fixture.homeTeamApiId, fixture.competition).catch(() => defaultStats()),
                fixtureService.getTeamStats(cfg.apiKey, fixture.awayTeamApiId, fixture.competition).catch(() => defaultStats()),
                fixtureService.getH2H(cfg.apiKey, fixture.matchApiId).catch(() => defaultH2H()),
              ])

          return generateMatchPrediction(
            { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam, competition: fixture.competition, country: fixture.country, utcDate: fixture.utcDate, homeStats, awayStats, h2h, league },
            cfg.minConfidence
          )
        } catch (err: any) {
          console.error(`[engine] ${fixture.homeTeam} vs ${fixture.awayTeam}: ${err.message}`)
          return generateMatchPrediction(
            { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam, competition: fixture.competition, country: fixture.country, utcDate: fixture.utcDate, homeStats: defaultStats(), awayStats: defaultStats(), h2h: defaultH2H(), league: LEAGUE_DEFAULTS },
            cfg.minConfidence
          )
        }
      })
    )

    predictions.sort((a, b) => (b.predictions[0]?.confidence ?? 0) - (a.predictions[0]?.confidence ?? 0))

    return NextResponse.json({
      predictions,
      generatedAt: new Date().toISOString(),
      sources: { footballDataOrg: fdoFixtures.length, apiFootball: intlFixtures.length, total: allFixtures.length },
    })
  } catch (err: any) {
    console.error('[/api/predictions]', err)
    return NextResponse.json({ error: err.message, predictions: [] }, { status: 500 })
  }
}
