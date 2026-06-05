// components/predictions/MatchBlock.tsx
import { PredictionCard } from './PredictionCard'

interface MatchPrediction { fixture: any; predictions: any[]; riskLevel: string; status: string }

const RISK_STYLE: Record<string, string> = {
  'Ultra Safe': 'badge-ultra',
  'Very Safe':  'badge-vsafe',
  'Safe':       'badge-safe',
  'Moderate':   'badge-mod',
  'Discard':    'badge-low',
  'Watch':      'badge-mod',
  'Recommended':'badge-vsafe',
}

export function MatchBlock({ match, index = 0 }: { match: MatchPrediction; index?: number }) {
  const { fixture, predictions, riskLevel, status } = match
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

      {/* ── Section rule ── */}
      <div className="px-5">
        <div className="section-rule"><span>Top 3 Safest Predictions</span></div>
      </div>

      {/* ── Predictions grid ── */}
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
    </section>
  )
}
