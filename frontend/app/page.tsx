// app/page.tsx — Dashboard
import { StatCard } from '@/components/ui/StatCard'
import { MatchBlock } from '@/components/predictions/MatchBlock'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'
import { fetchPredictions } from '@/lib/api'

export default async function DashboardPage() {
  const data = await fetchPredictions().catch(() => ({ predictions: [] }))
  const predictions = data.predictions ?? []
  const top = predictions.slice(0, 3)

  const avgConf = predictions.length
    ? predictions.reduce((s, m) =>
        s + m.predictions.reduce((a, p) => a + p.confidence, 0) / m.predictions.length, 0
      ) / predictions.length
    : 0

  const ultraSafeCount = predictions.reduce((s, m) =>
    s + m.predictions.filter(p => p.confidence >= 95).length, 0)

  return (
    <div className="space-y-8 max-w-[1200px]">

      {/* ── Page header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">JPredict · Football Intelligence</p>
        <h1 className="md-h2" style={{ fontSize: 'clamp(2rem,4vw,3.2rem)' }}>
          PREDICTION <span style={{ color: 'var(--amber)' }}>DASHBOARD</span>
        </h1>
        <p className="md-body mt-1">
          Statistical analysis engine · {predictions.length} match{predictions.length !== 1 ? 'es' : ''} processed today
        </p>
      </header>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 anim-fade anim-delay-1">
        <StatCard label="Matches Today"    value={predictions.length}         sub="fixtures analyzed"   />
        <StatCard label="Avg Confidence"   value={`${avgConf.toFixed(1)}%`}   sub="across all markets"  color="amber" />
        <StatCard label="Ultra Safe Picks" value={ultraSafeCount}             sub="≥ 95% confidence"    color="ultra" />
        <StatCard label="Algorithm"        value="v1.0"                       sub="Weighted rule model"  />
      </div>

      {/* ── Safety tier legend ── */}
      <div className="card p-5 anim-fade anim-delay-2">
        <div className="section-rule"><span>Confidence Classification System</span></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {[
            { label: '95% – 100%', name: 'Ultra Safe', cls: 'badge-ultra', val: 97 },
            { label: '90% – 94%',  name: 'Very Safe',  cls: 'badge-vsafe', val: 92 },
            { label: '85% – 89%',  name: 'Safe',       cls: 'badge-safe',  val: 87 },
            { label: '80% – 84%',  name: 'Moderate',   cls: 'badge-mod',   val: 82 },
          ].map(tier => (
            <div key={tier.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`pill ${tier.cls}`}>{tier.name}</span>
                <span className="label-lg">{tier.label}</span>
              </div>
              <div className="conf-track">
                <div className="conf-fill" style={{
                  width: `${tier.val}%`,
                  background: tier.cls.includes('ultra') ? 'var(--ultra)'
                    : tier.cls.includes('vsafe') ? 'var(--vsafe)'
                    : tier.cls.includes('safe') ? 'var(--safe)'
                    : 'var(--mod)'
                }} />
              </div>
            </div>
          ))}
        </div>
        <p className="md-body mt-4 text-xs">
          Only picks at <strong className="text-white/70">Moderate or above (≥ 80%)</strong> are surfaced to users.
          Predictions below threshold are automatically discarded by the engine.
        </p>
      </div>

      {/* ── Featured predictions ── */}
      <section className="anim-fade anim-delay-3">
        <div className="section-rule"><span>Featured Match Predictions</span></div>
        {top.length > 0 ? (
          <div className="space-y-4">
            {top.map((match, i) => (
              <MatchBlock key={match.fixture.id} match={match} index={i} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="heading-md" style={{ color: 'rgba(255,255,255,0.20)' }}>NO DATA</p>
            <p className="md-body mt-2 text-xs">Start the backend server and ensure an API key is configured in Settings.</p>
            <a href="/admin" className="btn-primary inline-flex mt-4 text-xs">Configure API Key</a>
          </div>
        )}
        {predictions.length > 3 && (
          <div className="mt-4 text-center">
            <a href="/predictions" className="btn-ghost">View all {predictions.length} matches →</a>
          </div>
        )}
      </section>

      {/* ── Engine methodology ── */}
      <section className="anim-fade anim-delay-4">
        <div className="section-rule"><span>Engine Methodology</span></div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: '## Match Winner',
              body:  'Form 30% · Home/Away 25% · H2H 20% · Goal Diff 15% · League Position 10%',
            },
            {
              title: '## Over/Under Goals',
              body:  'Goal Average 40% · Historical Over Rate 30% · H2H Goals 20% · Form 10%',
            },
            {
              title: '## BTTS / Corners / Cards',
              body:  'Weighted team averages, opponent rates, and league baselines across all specialty markets.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="card p-5">
              <p className="font-mono text-xs font-bold mb-2" style={{ color: 'var(--amber)', letterSpacing: '0.05em' }}>
                {title}
              </p>
              <hr className="section-hr" />
              <p className="md-body text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
