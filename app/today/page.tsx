// app/today/page.tsx — Today's Matches
import { fetchPredictions } from '@/lib/api'
import { MatchBlock } from '@/components/predictions/MatchBlock'

export default async function TodayPage() {
  const data = await fetchPredictions().catch(() => ({ predictions: [] }))
  const fixtures = data.predictions ?? []

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Group by competition
  const byComp: Record<string, typeof fixtures> = {}
  for (const m of fixtures) {
    const k = m.fixture.competition
    byComp[k] = [...(byComp[k] ?? []), m]
  }

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">Live Fixture Feed</p>
        <h1 className="md-h2">TODAY&apos;S <span style={{ color: 'var(--amber)' }}>MATCHES</span></h1>
        <p className="md-body mt-1">{today} · {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''} analyzed</p>
      </header>

      {/* ── Summary strip ── */}
      <div className="card px-5 py-4 flex flex-wrap gap-6 anim-fade anim-delay-1">
        <div>
          <p className="label-lg">Total Fixtures</p>
          <p className="stat-number mt-0.5" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--amber)' }}>
            {fixtures.length}
          </p>
        </div>
        <div>
          <p className="label-lg">Competitions</p>
          <p className="stat-number mt-0.5" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>
            {Object.keys(byComp).length}
          </p>
        </div>
        <div>
          <p className="label-lg">Ultra Safe Picks</p>
          <p className="stat-number mt-0.5" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ultra)' }}>
            {fixtures.reduce((s, m) => s + m.predictions.filter(p => p.confidence >= 95).length, 0)}
          </p>
        </div>
        <div className="ml-auto flex items-center">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="label-lg" style={{ color: 'var(--ultra)' }}>Engine Active</span>
          </div>
        </div>
      </div>

      {/* ── Matches grouped by competition ── */}
      {fixtures.length > 0 ? (
        Object.entries(byComp).map(([comp, matches]) => (
          <section key={comp} className="space-y-4">
            <div className="section-rule"><span>{comp}</span></div>
            {matches.map((m, i) => (
              <MatchBlock key={m.fixture.id} match={m} index={i} />
            ))}
          </section>
        ))
      ) : (
        <div className="card p-16 text-center anim-fade anim-delay-2">
          <p className="heading-md" style={{ color: 'rgba(255,255,255,0.15)' }}>NO FIXTURES</p>
          <p className="md-body mt-2 text-sm">No matches loaded. Verify the backend is running and the Football API key is valid.</p>
          <a href="/settings" className="btn-primary inline-flex mt-5">Check Settings</a>
        </div>
      )}
    </div>
  )
}
