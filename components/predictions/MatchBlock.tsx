// components/predictions/MatchBlock.tsx
import { PredictionCard } from './PredictionCard'

interface Odds {
  homeWin:   number | null
  draw:      number | null
  awayWin:   number | null
  over25:    number | null
  under25:   number | null
  bttsYes:   number | null
  bttsNo:    number | null
  bookmaker: string | null
}

interface MatchPrediction {
  fixture:     any
  predictions: any[]
  riskLevel:   string
  status:      string
  odds?:       Odds | null
}

const RISK_STYLE: Record<string, string> = {
  'Ultra Safe': 'badge-ultra',
  'Very Safe':  'badge-vsafe',
  'Safe':       'badge-safe',
  'Moderate':   'badge-mod',
  'Discard':    'badge-low',
  'Watch':      'badge-mod',
  'Recommended':'badge-vsafe',
}

function OddsRow({ odds, homeTeam, awayTeam }: { odds: Odds; homeTeam: string; awayTeam: string }) {
  const fmt = (v: number | null) => v != null ? v.toFixed(2) : '—'
  const hasAny = odds.homeWin || odds.draw || odds.awayWin || odds.over25 || odds.bttsYes

  if (!hasAny) return null

  return (
    <div
      className="px-5 pb-4"
    >
      <div className="section-rule"><span>Bookmaker Odds{odds.bookmaker ? ` · ${odds.bookmaker}` : ''}</span></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {/* 1X2 */}
        {(odds.homeWin || odds.draw || odds.awayWin) && (
          <div
            className="rounded p-3 text-center space-y-1"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
          >
            <p className="label-sm" style={{ fontSize: '0.6rem' }}>1X2</p>
            <div className="flex justify-between gap-1 text-xs font-mono">
              <span style={{ color: 'var(--amber)' }}>{fmt(odds.homeWin)}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{fmt(odds.draw)}</span>
              <span style={{ color: 'var(--ultra)' }}>{fmt(odds.awayWin)}</span>
            </div>
            <div className="flex justify-between gap-1" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)' }}>
              <span>1</span><span>X</span><span>2</span>
            </div>
          </div>
        )}
        {/* Over/Under */}
        {(odds.over25 || odds.under25) && (
          <div
            className="rounded p-3 text-center space-y-1"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
          >
            <p className="label-sm" style={{ fontSize: '0.6rem' }}>Over/Under 2.5</p>
            <div className="flex justify-between gap-1 text-xs font-mono">
              <span style={{ color: 'var(--vsafe)' }}>{fmt(odds.over25)}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{fmt(odds.under25)}</span>
            </div>
            <div className="flex justify-between gap-1" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)' }}>
              <span>Over</span><span>Under</span>
            </div>
          </div>
        )}
        {/* BTTS */}
        {(odds.bttsYes || odds.bttsNo) && (
          <div
            className="rounded p-3 text-center space-y-1"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
          >
            <p className="label-sm" style={{ fontSize: '0.6rem' }}>BTTS</p>
            <div className="flex justify-between gap-1 text-xs font-mono">
              <span style={{ color: 'var(--vsafe)' }}>{fmt(odds.bttsYes)}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{fmt(odds.bttsNo)}</span>
            </div>
            <div className="flex justify-between gap-1" style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)' }}>
              <span>Yes</span><span>No</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MatchBlock({ match, index = 0 }: { match: MatchPrediction; index?: number }) {
  const { fixture, predictions, riskLevel, status, odds } = match
  const dt = new Date(fixture.utcDate)

  return (
    <section
      className={`card overflow-hidden anim-fade anim-delay-${Math.min(index + 1, 5)}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* ── Match header ── */}
      <div
        className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-dim)' }}
      >
        <div className="space-y-0.5">
          <p className="label-lg">{fixture.competition} · {fixture.country}</p>
          <h2
            className="font-display text-white leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', letterSpacing: '0.04em' }}
          >
            {fixture.homeTeam}{' '}
            <span style={{ color: 'rgba(255,255,255,0.30)' }}>VS</span>{' '}
            {fixture.awayTeam}
          </h2>
          <p className="label-sm" style={{ marginTop: '4px' }}>
            {dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}
            {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`pill ${RISK_STYLE[riskLevel] ?? 'badge-mod'}`}>{riskLevel}</span>
          <span className={`pill ${status === 'Recommended' ? 'badge-ultra' : 'badge-mod'}`}>
            {status}
          </span>
        </div>
      </div>

      {/* ── Predictions ── */}
      <div className="px-5">
        <div className="section-rule"><span>Top 3 Safest Predictions</span></div>
      </div>

      <div className="px-5 pb-5 grid sm:grid-cols-3 gap-3">
        {predictions.map((p: any, i: number) => (
          <PredictionCard
            key={p.market}
            rank={i + 1}
            market={p.market}
            confidence={p.confidence}
            reason={p.reason}
            isTop={i === 0}
          />
        ))}
      </div>

      {/* ── Bookmaker odds (if available) ── */}
      {odds && <OddsRow odds={odds} homeTeam={fixture.homeTeam} awayTeam={fixture.awayTeam} />}
    </section>
  )
}
