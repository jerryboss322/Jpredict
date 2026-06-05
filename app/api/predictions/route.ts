// app/api/predictions/route.ts
// Next.js Route Handler — runs as a Vercel Serverless Function.
// Replaces the Express GET /api/predictions endpoint entirely.
// The frontend lib/api.ts calls this at /api/predictions — same URL, zero config change.

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

// Cache responses for 15 minutes on Vercel Edge
export const revalidate = 900

export async function GET() {
  const cfg = getConfig()

  if (!cfg.apiKey) {
    return NextResponse.json(
      {
        error: 'FOOTBALL_DATA_API_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables.',
        predictions: [],
      },
      { status: 503 }
    )
  }

  try {
    const fixtures = await fixtureService.getTodayFixtures(cfg.apiKey, cfg.activeLeagues)

    if (fixtures.length === 0) {
      return NextResponse.json({
        predictions: [],
        message: 'No fixtures today for the configured leagues.',
        generatedAt: new Date().toISOString(),
      })
    }

    const predictions = await Promise.all(
      fixtures.map(async (fixture) => {
        try {
          const [homeStats, awayStats, h2h] = await Promise.all([
            fixtureService.getTeamStats(cfg.apiKey, fixture.homeTeamApiId, fixture.competition).catch(() => defaultStats()),
            fixtureService.getTeamStats(cfg.apiKey, fixture.awayTeamApiId, fixture.competition).catch(() => defaultStats()),
            fixtureService.getH2H(cfg.apiKey, fixture.matchApiId).catch(() => defaultH2H()),
          ])

          const league = fixtureService.getLeagueBaseline(fixture.competition) ?? LEAGUE_DEFAULTS

          const input: PredictionInput = {
            homeTeam:    fixture.homeTeam,
            awayTeam:    fixture.awayTeam,
            competition: fixture.competition,
            country:     fixture.country,
            utcDate:     fixture.utcDate,
            homeStats,
            awayStats,
            h2h,
            league,
          }

          return generateMatchPrediction(input, cfg.minConfidence)
        } catch (err: any) {
          console.error(`[predictions] Engine error for ${fixture.homeTeam} vs ${fixture.awayTeam}:`, err.message)
          return generateMatchPrediction(
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
        }
      })
    )

    // Sort highest confidence first
    predictions.sort(
      (a, b) => (b.predictions[0]?.confidence ?? 0) - (a.predictions[0]?.confidence ?? 0)
    )

    return NextResponse.json({
      predictions,
      generatedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[/api/predictions]', err)
    return NextResponse.json(
      { error: err.message, predictions: [] },
      { status: 500 }
    )
  }
}
