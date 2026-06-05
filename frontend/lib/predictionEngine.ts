// backend/src/services/predictionEngine.ts
// JPredict Prediction Engine v1
// Implements the full weighted formula:
//
//   Match Winner:   Form 30% · H/A Strength 25% · H2H 20% · Goal Diff 15% · Position 10%
//   Over Goals:     Goal Avg 40% · Over Rate History 30% · H2H Goals 20% · Form 10%
//   BTTS:           Scoring Rate 40% · Conceded Rate 30% · H2H BTTS 20% · Form 10%
//   Corners:        Team Avg 50% · Opponent Avg 30% · League Avg 20%
//   Cards:          Team Avg 40% · Opponent Avg 30% · League Avg 20% · Form 10%

export interface TeamStats {
  // Form (last 10 matches)
  wins10: number; draws10: number; losses10: number
  goalsScored10: number; goalsConceded10: number
  // Form (last 5 matches)
  wins5: number; draws5: number; losses5: number
  goalsScored5: number; goalsConceded5: number
  // Over rates (0–1)
  over05Rate: number; over15Rate: number
  over25Rate: number; over35Rate: number
  // BTTS / clean sheet
  bttsRate: number; cleanSheetRate: number
  // Home / Away splits
  homeWins: number; homeGoalsScored: number; homeGoalsConceded: number
  awayWins: number; awayGoalsScored: number; awayGoalsConceded: number
  // Corners (may be 0 on free API tier)
  avgCornersFor: number; avgCornersAgainst: number
  over85CornersRate: number
  // Cards
  avgYellow: number; avgRed: number
  avgTotalCards: number; over25CardsRate: number
  // League
  leaguePosition: number
}

export interface H2HStats {
  totalMatches: number
  homeWins: number; draws: number; awayWins: number
  avgGoals: number; bttsRate: number
}

export interface LeagueBaseline {
  avgGoals:   number  // default 2.65
  avgCorners: number  // default 10.2
  avgCards:   number  // default 3.8
  homeWinRate: number // default 0.46
}

export interface PredictionInput {
  homeTeam:     string
  awayTeam:     string
  competition:  string
  country:      string
  utcDate:      string
  homeStats:    TeamStats
  awayStats:    TeamStats
  h2h:          H2HStats
  league:       LeagueBaseline
}

export interface MarketPrediction {
  market:     string
  confidence: number   // 0–100
  reason:     string
}

export interface MatchPrediction {
  fixture:     { id: string; utcDate: string; competition: string; country: string; homeTeam: string; awayTeam: string }
  predictions: MarketPrediction[]   // top 3
  riskLevel:   string
  status:      string
  // Raw probabilities for the analysis page
  raw?: {
    homeWinProb: number; drawProb: number; awayWinProb: number
    over15Prob: number;  over25Prob: number; bttsProb: number
    homeXG: number; awayXG: number
  }
}

// ── League defaults ─────────────────────────────────────────────────────────

export const LEAGUE_DEFAULTS: LeagueBaseline = {
  avgGoals:    2.65,
  avgCorners:  10.2,
  avgCards:    3.8,
  homeWinRate: 0.46,
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function generateMatchPrediction(
  input: PredictionInput,
  minConfidence = 80
): MatchPrediction {
  const { homeStats: h, awayStats: a, h2h, league } = input

  // ── 1. Form scores (0–100) ──────────────────────────────────────────────
  const homeFormScore = formScore(h.wins10, h.draws10, h.losses10)
  const awayFormScore = formScore(a.wins10, a.draws10, a.losses10)

  // ── 2. Attack / defence strength ────────────────────────────────────────
  const homeAttack  = clamp((h.goalsScored10 / 10) / (league.avgGoals / 2) * 50, 0, 100)
  const awayAttack  = clamp((a.goalsScored10 / 10) / (league.avgGoals / 2) * 50, 0, 100)
  const homeDefence = clamp(100 - (h.goalsConceded10 / 10) / (league.avgGoals / 2) * 50, 0, 100)
  const awayDefence = clamp(100 - (a.goalsConceded10 / 10) / (league.avgGoals / 2) * 50, 0, 100)

  // ── 3. Home/Away strength score ──────────────────────────────────────────
  const homeSideStrength = clamp(
    50 + ((h.homeGoalsScored / Math.max(1, h.homeWins + 5)) - (a.awayGoalsScored / Math.max(1, a.awayWins + 5))) * 4,
    10, 90
  )

  // ── 4. H2H score ─────────────────────────────────────────────────────────
  const h2hScore = h2h.totalMatches > 0
    ? clamp((h2h.homeWins / h2h.totalMatches) * 100, 0, 100)
    : 50

  // ── 5. Goal difference score ─────────────────────────────────────────────
  const homeGD  = h.goalsScored10 - h.goalsConceded10
  const awayGD  = a.goalsScored10 - a.goalsConceded10
  const gdScore = clamp(50 + (homeGD - awayGD) * 3, 10, 90)

  // ── 6. League position score ─────────────────────────────────────────────
  const homePosScore = clamp(100 - (h.leaguePosition - 1) * 4, 10, 95)
  const awayPosScore = clamp(100 - (a.leaguePosition - 1) * 4, 10, 95)
  const posScore     = clamp(50 + (homePosScore - awayPosScore), 10, 90)

  // ── 7. Match winner weighted score (JPredict formula) ────────────────────
  const homeWinScore =
    homeFormScore     * 0.30 +
    homeSideStrength  * 0.25 +
    h2hScore          * 0.20 +
    gdScore           * 0.15 +
    posScore          * 0.10

  const awayWinScore =
    awayFormScore              * 0.30 +
    (100 - homeSideStrength)   * 0.25 +
    (100 - h2hScore)           * 0.20 +
    (100 - gdScore)            * 0.15 +
    (100 - posScore)           * 0.10

  // Softmax normalise for win/draw/away
  const drawRaw = 100 - Math.abs(homeWinScore - awayWinScore) * 0.55
  const total   = homeWinScore + drawRaw + awayWinScore
  const homeWinProb = clamp((homeWinScore / total) * 100, 5, 80)
  const awayWinProb = clamp((awayWinScore / total) * 100, 5, 80)
  const drawProb    = clamp(100 - homeWinProb - awayWinProb, 8, 38)

  // ── 8. Expected goals (xG) ────────────────────────────────────────────────
  const homeXG = clamp(
    (h.goalsScored10 / 10) * (a.goalsConceded10 / 10) / (league.avgGoals / 2) * 1.08,
    0.1, 4.5
  )
  const awayXG = clamp(
    (a.goalsScored10 / 10) * (h.goalsConceded10 / 10) / (league.avgGoals / 2) * 0.94,
    0.1, 4.5
  )
  const totalXG = homeXG + awayXG

  // ── 9. Over/under probabilities (JPredict formula) ───────────────────────
  const over15Prob = weightedAvg([
    [poissonOver(totalXG, 1.5) * 100,              0.40],
    [(h.over15Rate + a.over15Rate) / 2 * 100,      0.30],
    [Math.min((h2h.avgGoals / 1.5) * 60, 95),      0.20],
    [(homeFormScore + awayFormScore) / 2 * 0.5,    0.10],
  ])

  const over25Prob = weightedAvg([
    [poissonOver(totalXG, 2.5) * 100,              0.40],
    [(h.over25Rate + a.over25Rate) / 2 * 100,      0.30],
    [Math.min((h2h.avgGoals / 2.5) * 50, 95),      0.20],
    [(homeAttack + awayAttack) / 2,                0.10],
  ])

  const under45Prob = clamp(100 - poissonOver(totalXG, 4.5) * 100, 25, 97)

  // ── 10. BTTS (JPredict formula) ───────────────────────────────────────────
  const pHome    = 1 - Math.exp(-homeXG)
  const pAway    = 1 - Math.exp(-awayXG)
  const bttsProb = weightedAvg([
    [(h.bttsRate + a.bttsRate) / 2 * 100,                             0.40],
    [(1 - h.cleanSheetRate + 1 - a.cleanSheetRate) / 2 * 100,        0.30],
    [h2h.bttsRate * 100,                                              0.20],
    [pHome * pAway * 100,                                             0.10],
  ])

  // ── 11. Corners (JPredict formula: 50/30/20) ──────────────────────────────
  const homeOver45Corners = clamp(
    (h.avgCornersFor / 4.5) * 50 + h.over85CornersRate * 30 + (league.avgCorners / 4.5) * 20,
    10, 90
  )
  const awayOver45Corners = clamp(
    (a.avgCornersFor / 4.5) * 50 + a.over85CornersRate * 30 + (league.avgCorners / 4.5) * 20,
    10, 90
  )

  // ── 12. Cards (JPredict formula: 40/30/20/10) ─────────────────────────────
  const over25Cards = clamp(
    h.avgTotalCards / league.avgCards * 40 +
    a.avgTotalCards / league.avgCards * 30 +
    ((h.avgTotalCards + a.avgTotalCards) / 2) / league.avgCards * 20 +
    (homeFormScore + awayFormScore) / 2 * 0.003 * 10,
    15, 85
  )

  // ── 13. Assemble all markets ──────────────────────────────────────────────

  const homeTeamShort = input.homeTeam.split(' ').pop() ?? input.homeTeam
  const awayTeamShort = input.awayTeam.split(' ').pop() ?? input.awayTeam

  const allMarkets: MarketPrediction[] = [
    {
      market: `Over 1.5 Goals`,
      confidence: toConfidence(over15Prob, (h.over15Rate + a.over15Rate) / 2),
      reason: `Combined xG of ${totalXG.toFixed(2)} · historical over-1.5 rate ${pct((h.over15Rate + a.over15Rate) / 2)} · H2H avg ${h2h.avgGoals.toFixed(1)} goals`,
    },
    {
      market: `Over 2.5 Goals`,
      confidence: toConfidence(over25Prob, (h.over25Rate + a.over25Rate) / 2),
      reason: `xG model projects ${totalXG.toFixed(2)} total goals · both teams average ${pct((h.over25Rate + a.over25Rate) / 2)} over-2.5 rate`,
    },
    {
      market: `Under 4.5 Goals`,
      confidence: toConfidence(under45Prob, 0.85),
      reason: `Poisson model gives ${(100 - poissonOver(totalXG, 4.5) * 100).toFixed(1)}% under-4.5 probability from xG ${totalXG.toFixed(2)}`,
    },
    {
      market: `BTTS`,
      confidence: toConfidence(bttsProb, (h.bttsRate + a.bttsRate) / 2),
      reason: `${input.homeTeam} BTTS rate ${pct(h.bttsRate)} · ${input.awayTeam} ${pct(a.bttsRate)} · H2H BTTS ${pct(h2h.bttsRate)}`,
    },
    {
      market: `${homeTeamShort} Win`,
      confidence: clamp(homeWinScore * 0.95, 0, 97),
      reason: `Form score ${homeFormScore.toFixed(0)} · home strength ${homeSideStrength.toFixed(0)} · H2H home wins ${h2h.homeWins}/${h2h.totalMatches}`,
    },
    {
      market: `${awayTeamShort} Win`,
      confidence: clamp(awayWinScore * 0.95, 0, 97),
      reason: `Away form score ${awayFormScore.toFixed(0)} · H2H away wins ${h2h.awayWins}/${h2h.totalMatches} · goal diff ${awayGD}`,
    },
    {
      market: `${homeTeamShort} or Draw`,
      confidence: clamp((homeWinScore + 50 + drawProb * 0.5) / 2 * 0.92, 0, 97),
      reason: `Home side strength ${homeSideStrength.toFixed(0)} · home win + draw covers ${(homeWinProb + drawProb).toFixed(0)}% probability`,
    },
    {
      market: `${homeTeamShort} Draw No Bet`,
      confidence: clamp(homeWinScore * 0.88, 0, 96),
      reason: `Eliminates draw risk from home win · raw home win probability ${homeWinProb.toFixed(0)}%`,
    },
    {
      market: `${homeTeamShort} Over 4.5 Corners`,
      confidence: clamp(homeOver45Corners, 15, 90),
      reason: `${input.homeTeam} averages ${h.avgCornersFor.toFixed(1)} corners/game · league avg ${league.avgCorners}`,
    },
    {
      market: `Over 2.5 Cards`,
      confidence: clamp(over25Cards, 15, 85),
      reason: `Combined card avg ${(h.avgTotalCards + a.avgTotalCards).toFixed(1)}/game · league baseline ${league.avgCards}`,
    },
  ]

  // Sort descending by confidence, filter by threshold, take top 3
  const sorted = [...allMarkets].sort((a, b) => b.confidence - a.confidence)
  const top3   = sorted.filter(m => m.confidence >= minConfidence).slice(0, 3)

  // If nothing clears the threshold, take the top 3 regardless
  const final = top3.length >= 3 ? top3 : sorted.slice(0, 3)

  const topConf   = final[0]?.confidence ?? 0
  const riskLevel = topConf >= 95 ? 'Ultra Safe'
    : topConf >= 90 ? 'Very Safe'
    : topConf >= 85 ? 'Safe'
    : topConf >= 80 ? 'Moderate'
    : 'Watch'

  const status = topConf >= 85 ? 'Recommended' : 'Watch'

  const fixtureId = `${input.homeTeam}-${input.awayTeam}-${input.utcDate}`.replace(/\s/g, '_')

  return {
    fixture: {
      id:          fixtureId,
      utcDate:     input.utcDate,
      competition: input.competition,
      country:     input.country,
      homeTeam:    input.homeTeam,
      awayTeam:    input.awayTeam,
    },
    predictions: final,
    riskLevel,
    status,
    raw: {
      homeWinProb: round(homeWinProb),
      drawProb:    round(drawProb),
      awayWinProb: round(awayWinProb),
      over15Prob:  round(over15Prob),
      over25Prob:  round(over25Prob),
      bttsProb:    round(bttsProb),
      homeXG:      round(homeXG, 2),
      awayXG:      round(awayXG, 2),
    },
  }
}

// ── Default stats (used when API data is unavailable) ───────────────────────

export function defaultStats(position = 10): TeamStats {
  return {
    wins10: 4, draws10: 2, losses10: 4,
    goalsScored10: 12, goalsConceded10: 11,
    wins5: 2, draws5: 1, losses5: 2,
    goalsScored5: 6, goalsConceded5: 5,
    over05Rate: 0.90, over15Rate: 0.70, over25Rate: 0.50, over35Rate: 0.30,
    bttsRate: 0.50, cleanSheetRate: 0.25,
    homeWins: 3, homeGoalsScored: 7, homeGoalsConceded: 5,
    awayWins: 2, awayGoalsScored: 5, awayGoalsConceded: 7,
    avgCornersFor: 5.1, avgCornersAgainst: 5.1, over85CornersRate: 0.50,
    avgYellow: 1.8, avgRed: 0.1, avgTotalCards: 1.9, over25CardsRate: 0.45,
    leaguePosition: position,
  }
}

export function defaultH2H(): H2HStats {
  return { totalMatches: 0, homeWins: 0, draws: 0, awayWins: 0, avgGoals: 2.65, bttsRate: 0.50 }
}

// ── Math helpers ─────────────────────────────────────────────────────────────

function formScore(w: number, d: number, l: number): number {
  const total = w + d + l
  if (!total) return 50
  return clamp((w * 3 + d) / (total * 3) * 100, 0, 100)
}

function weightedAvg(pairs: [number, number][]): number {
  const totalW = pairs.reduce((s, [, w]) => s + w, 0)
  return pairs.reduce((s, [v, w]) => s + v * w, 0) / totalW
}

function poissonOver(lambda: number, threshold: number): number {
  const floor = Math.floor(threshold)
  let cdf = 0
  for (let k = 0; k <= floor; k++) cdf += poissonPMF(lambda, k)
  return clamp(1 - cdf, 0.02, 0.99)
}

function poissonPMF(lambda: number, k: number): number {
  let f = 1
  for (let i = 2; i <= k; i++) f *= i
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / f
}

/** Convert a raw probability + historical bias into a confidence score */
function toConfidence(prob: number, histBias: number): number {
  const signal = Math.abs(prob - 50) / 50
  return clamp(prob * 0.75 + signal * prob * 0.15 + histBias * 100 * 0.10, 0, 99)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function pct(r: number): string {
  return `${Math.round(r * 100)}%`
}

function round(v: number, d = 1): number {
  return Math.round(v * 10 ** d) / 10 ** d
}
