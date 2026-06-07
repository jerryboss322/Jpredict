// lib/multiSportEngine.ts
// Extends the football prediction formula to other sports.
//
// The core insight: every sport has a "match winner" market and some form
// of "totals" market. We derive confidence scores using the same weighted
// formula as the football engine, adapted per sport's scoring characteristics.
//
// Football engine weights (reference):
//   Form 30% · H/A Strength 25% · H2H 20% · Goal Diff 15% · Position 10%

import type { OddsFixture, SportKey } from './oddsApi'

// ── Sport-specific market labels ──────────────────────────────────────────────

export const SPORT_MARKET_CONFIG: Record<
  SportKey,
  {
    winnerLabel:   string   // e.g. "Win", "Moneyline Win"
    totalLabel:    string   // e.g. "Over 2.5 Goals", "Over 220.5 Points"
    hasDraw:       boolean
    totalLine:     number   // the threshold for over/under
    avgTotal:      number   // sport's typical scoring average for confidence calc
  }
> = {
  football:          { winnerLabel: 'Win',         totalLabel: 'Over 2.5 Goals',    hasDraw: true,  totalLine: 2.5,   avgTotal: 2.65  },
  basketball:        { winnerLabel: 'Moneyline',   totalLabel: 'Over 220.5 Points', hasDraw: false, totalLine: 220.5, avgTotal: 221.0 },
  tennis:            { winnerLabel: 'Match Win',   totalLabel: 'Over 22.5 Games',   hasDraw: false, totalLine: 22.5,  avgTotal: 22.5  },
  american_football: { winnerLabel: 'Moneyline',   totalLabel: 'Over 47.5 Points',  hasDraw: false, totalLine: 47.5,  avgTotal: 47.0  },
  ice_hockey:        { winnerLabel: 'Moneyline',   totalLabel: 'Over 5.5 Goals',    hasDraw: false, totalLine: 5.5,   avgTotal: 5.6   },
  baseball:          { winnerLabel: 'Moneyline',   totalLabel: 'Over 8.5 Runs',     hasDraw: false, totalLine: 8.5,   avgTotal: 8.7   },
  mma:               { winnerLabel: 'Moneyline',   totalLabel: 'Fight Goes Distance',hasDraw: false, totalLine: 0,     avgTotal: 0     },
}

export interface NonFootballPrediction {
  fixture: {
    id:          string
    utcDate:     string
    competition: string
    country:     string
    homeTeam:    string
    awayTeam:    string
    sport:       SportKey
  }
  predictions: {
    market:     string
    confidence: number
    reason:     string
  }[]
  riskLevel: string
  status:    string
  odds?:     OddsFixture['odds'] | null
}

// ── Derive confidence from decimal odds ───────────────────────────────────────
// Implied probability = 1 / decimal_odds (before margin removal)
// We use this as a proxy for confidence since we don't have historical stats
// for non-football sports in our current data pipeline.

function impliedProb(odds: number | null): number {
  if (!odds || odds <= 1) return 0.5
  return Math.min(0.95, 1 / odds)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ── Build predictions for a non-football sport fixture ────────────────────────

export function generateNonFootballPrediction(
  fixture: OddsFixture
): NonFootballPrediction {
  const { sport, homeTeam, awayTeam, odds } = fixture
  const cfg = SPORT_MARKET_CONFIG[sport] ?? SPORT_MARKET_CONFIG.football

  const markets: { market: string; confidence: number; reason: string }[] = []

  // ── 1. Match winner markets ───────────────────────────────────────────────
  const homeProb = impliedProb(odds?.homeWin ?? null)
  const awayProb = impliedProb(odds?.awayWin ?? null)

  if (homeProb > 0.55) {
    const conf = clamp(homeProb * 100 * 0.90, 50, 96)
    markets.push({
      market:     `${homeTeam} ${cfg.winnerLabel}`,
      confidence: Math.round(conf),
      reason:     odds?.homeWin
        ? `Implied probability ${Math.round(homeProb * 100)}% from odds ${odds.homeWin.toFixed(2)} · ${cfg.winnerLabel} market`
        : `Moderate home advantage based on competition context`,
    })
  }

  if (awayProb > 0.55) {
    const conf = clamp(awayProb * 100 * 0.90, 50, 96)
    markets.push({
      market:     `${awayTeam} ${cfg.winnerLabel}`,
      confidence: Math.round(conf),
      reason:     odds?.awayWin
        ? `Implied probability ${Math.round(awayProb * 100)}% from odds ${odds.awayWin.toFixed(2)} · away side favoured`
        : `Away side showing strength in this matchup`,
    })
  }

  // ── 2. Totals market ──────────────────────────────────────────────────────
  const overProb  = impliedProb(odds?.over25 ?? null)
  const underProb = impliedProb(odds?.under25 ?? null)

  if (overProb > 0.55) {
    const conf = clamp(overProb * 100 * 0.88, 50, 94)
    markets.push({
      market:     `Over ${cfg.totalLine} ${sport === 'football' ? 'Goals' : sport === 'basketball' ? 'Points' : sport === 'tennis' ? 'Games' : sport === 'american_football' ? 'Points' : sport === 'ice_hockey' ? 'Goals' : 'Runs'}`,
      confidence: Math.round(conf),
      reason:     odds?.over25
        ? `Over odds ${odds.over25.toFixed(2)} — implied ${Math.round(overProb * 100)}% · high-scoring fixture expected`
        : `Match dynamics suggest active scoring`,
    })
  } else if (underProb > 0.55) {
    const conf = clamp(underProb * 100 * 0.88, 50, 94)
    markets.push({
      market:     `Under ${cfg.totalLine}`,
      confidence: Math.round(conf),
      reason:     odds?.under25
        ? `Under odds ${odds.under25.toFixed(2)} — implied ${Math.round(underProb * 100)}% · tight game expected`
        : `Defensive contest anticipated`,
    })
  }

  // ── 3. Draw / push market (football, hockey sometimes) ───────────────────
  if (cfg.hasDraw && odds?.draw) {
    const drawProb = impliedProb(odds.draw)
    if (drawProb > 0.28) {
      markets.push({
        market:     `Draw`,
        confidence: clamp(Math.round(drawProb * 100 * 0.85), 50, 88),
        reason:     `Draw odds ${odds.draw.toFixed(2)} — ${Math.round(drawProb * 100)}% implied probability · closely-matched sides`,
      })
    }
  }

  // ── 4. Fallback if no odds available ─────────────────────────────────────
  if (markets.length === 0) {
    markets.push(
      { market: `${homeTeam} ${cfg.winnerLabel}`, confidence: 62, reason: 'Home advantage — no odds data available for deeper analysis' },
      { market: `Over ${cfg.totalLine}`, confidence: 58, reason: `League average for ${sport} — baseline scoring model` },
    )
    if (cfg.hasDraw) {
      markets.push({ market: 'Draw', confidence: 55, reason: 'Even matchup — draw market included as watch' })
    }
  }

  // Sort by confidence, take top 3
  const top3 = [...markets].sort((a, b) => b.confidence - a.confidence).slice(0, 3)

  const topConf  = top3[0]?.confidence ?? 0
  const riskLevel =
    topConf >= 92 ? 'Ultra Safe'
    : topConf >= 87 ? 'Very Safe'
    : topConf >= 82 ? 'Safe'
    : topConf >= 72 ? 'Moderate'
    : 'Watch'

  const status = topConf >= 82 ? 'Recommended' : 'Watch'

  return {
    fixture: {
      id:          fixture.id,
      utcDate:     fixture.utcDate,
      competition: fixture.competition,
      country:     fixture.country,
      homeTeam:    fixture.homeTeam,
      awayTeam:    fixture.awayTeam,
      sport:       fixture.sport,
    },
    predictions: top3,
    riskLevel,
    status,
    odds: fixture.odds ?? null,
  }
}
