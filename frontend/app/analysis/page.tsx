// app/analysis/page.tsx — Match Analysis
import { fetchPredictions } from '@/lib/api'
import { PredictionCard } from '@/components/predictions/PredictionCard'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'

export default async function AnalysisPage() {
  const data = await fetchPredictions().catch(() => ({ predictions: [] }))
  const fixtures = data.predictions ?? []
  const match = fixtures[0] ?? null

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">Full Statistical Breakdown</p>
        <h1 className="md-h2">MATCH <span style={{ color: 'var(--amber)' }}>ANALYSIS</span></h1>
        <p className="md-body mt-1">
          Drill into confidence factors, market probabilities, and engine reasoning for each prediction.
        </p>
      </header>

      {match ? (
        <>
          {/* ── Match identity ── */}
          <div className="card p-6 anim-fade anim-delay-1" style={{ borderColor: 'rgba(245,166,35,0.18)' }}>
            <p className="label-lg">{match.fixture.competition} · {match.fixture.country}</p>
            <h2 className="md-h2 mt-1">
              {match.fixture.homeTeam}{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>vs</span>{' '}
              {match.fixture.awayTeam}
            </h2>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="label-lg">
                {new Date(match.fixture.utcDate).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </span>
              <span className="pill badge-amber-rim" style={{ background: 'rgba(245,166,35,0.10)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.25)' }}>
                {match.riskLevel}
              </span>
              <span className={`pill ${match.status === 'Recommended' ? 'badge-ultra' : 'badge-mod'}`}>
                {match.status}
              </span>
            </div>
          </div>

          {/* ── Top 3 picks + confidence breakdown ── */}
          <div className="grid lg:grid-cols-[1fr_340px] gap-6 anim-fade anim-delay-2">
            {/* Predictions */}
            <div className="space-y-3">
              <div className="section-rule"><span>## Top 3 Safest Predictions</span></div>
              {match.predictions.map((p: any, i: number) => (
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

            {/* Confidence sidebar */}
            <div className="space-y-4">
              <div className="section-rule"><span>## Confidence Scores</span></div>
              <div className="card p-5 space-y-4">
                {match.predictions.map((p: any) => (
                  <ConfidenceBar
                    key={p.market}
                    label={p.market}
                    value={p.confidence}
                  />
                ))}
              </div>

              {/* Engine formula reference */}
              <div className="card p-5">
                <p className="label-lg mb-3">### Engine Formula</p>
                <hr className="section-hr" />
                <div className="space-y-2">
                  {[
                    { factor: 'Team Form',        weight: '30%', bar: 30 },
                    { factor: 'Home/Away Str.',    weight: '25%', bar: 25 },
                    { factor: 'Head-to-Head',      weight: '20%', bar: 20 },
                    { factor: 'Goal Difference',   weight: '15%', bar: 15 },
                    { factor: 'League Position',   weight: '10%', bar: 10 },
                  ].map(row => (
                    <div key={row.factor} className="flex items-center gap-3">
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="label-lg">{row.factor}</span>
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--amber)' }}>{row.weight}</span>
                        </div>
                        <div className="conf-track">
                          <div className="conf-fill" style={{ width: `${row.bar * 3.33}%`, background: 'var(--amber)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── All fixtures quick view ── */}
          {fixtures.length > 1 && (
            <section className="anim-fade anim-delay-3">
              <div className="section-rule"><span>Other Matches Today</span></div>
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-dim)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Competition</th>
                      <th>Top Pick</th>
                      <th>Confidence</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixtures.slice(1).map((m: any) => {
                      const top = m.predictions[0]
                      return (
                        <tr key={m.fixture.id}>
                          <td className="font-medium text-white/85">
                            {m.fixture.homeTeam} vs {m.fixture.awayTeam}
                          </td>
                          <td>{m.fixture.competition}</td>
                          <td style={{ color: 'var(--amber)' }}>{top?.market ?? '—'}</td>
                          <td className="font-mono font-bold">{top ? `${Math.round(top.confidence)}%` : '—'}</td>
                          <td>
                            <span className={`pill badge-${
                              m.riskLevel === 'Ultra Safe' ? 'ultra'
                              : m.riskLevel === 'Very Safe' ? 'vsafe'
                              : m.riskLevel === 'Safe' ? 'safe'
                              : 'mod'
                            }`}>
                              {m.riskLevel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="card p-16 text-center anim-fade anim-delay-1">
          <p className="heading-md" style={{ color: 'rgba(255,255,255,0.15)' }}>NO ANALYSIS</p>
          <p className="md-body mt-2 text-sm">No match data available. Start the backend and ensure fixtures are loaded.</p>
        </div>
      )}
    </div>
  )
}
