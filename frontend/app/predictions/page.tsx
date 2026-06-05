// app/predictions/page.tsx — All Predictions
import { fetchPredictions } from '@/lib/api'
import { MatchBlock } from '@/components/predictions/MatchBlock'
import { PredictionCard } from '@/components/predictions/PredictionCard'

export default async function PredictionsPage() {
  const data = await fetchPredictions().catch(() => ({ predictions: [] }))
  const fixtures = data.predictions ?? []

  const ultraSafe = fixtures.flatMap(m =>
    m.predictions.filter(p => p.confidence >= 95).map(p => ({ ...p, fixture: m.fixture }))
  ).sort((a, b) => b.confidence - a.confidence)

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">Confidence-Ranked Picks</p>
        <h1 className="md-h2">ALL <span style={{ color: 'var(--amber)' }}>PREDICTIONS</span></h1>
        <p className="md-body mt-1">
          Top-3 safest markets per match · sorted by confidence · only ≥ 80% threshold published
        </p>
      </header>

      {/* ── Ultra Safe Picks highlight ── */}
      {ultraSafe.length > 0 && (
        <section className="anim-fade anim-delay-1">
          <div className="section-rule"><span>🔒 Ultra Safe Picks — 95%+</span></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ultraSafe.map((p, i) => (
              <div key={`${p.fixture.id}-${p.market}`} className="card p-4 space-y-2" style={{ borderColor: 'rgba(0,229,160,0.25)', background: 'rgba(0,229,160,0.03)' }}>
                <p className="label-lg">{p.fixture.homeTeam} vs {p.fixture.awayTeam}</p>
                <p className="label-sm">{p.fixture.competition}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-semibold text-white/90 text-sm">{p.market}</span>
                  <span className="font-display text-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--ultra)' }}>
                    {Math.round(p.confidence)}%
                  </span>
                </div>
                <div className="conf-track">
                  <div className="conf-fill" style={{ width: `${p.confidence}%`, background: 'var(--ultra)' }} />
                </div>
                <p className="md-body text-xs">{p.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All match predictions ── */}
      <section className="space-y-4">
        <div className="section-rule"><span>All Matches · {fixtures.length} Total</span></div>
        {fixtures.length > 0 ? (
          fixtures.map((match, i) => <MatchBlock key={match.fixture.id} match={match} index={i} />)
        ) : (
          <div className="card p-16 text-center">
            <p className="heading-md" style={{ color: 'rgba(255,255,255,0.15)' }}>NO PREDICTIONS</p>
            <p className="md-body mt-2 text-sm">Backend is offline or no fixtures available for today.</p>
          </div>
        )}
      </section>
    </div>
  )
}
