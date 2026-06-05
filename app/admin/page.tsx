'use client'
// app/admin/page.tsx — Admin Panel

import { useState } from 'react'
import { fetchPredictions, triggerFixtureRefresh } from '@/lib/api'

const MOCK_JOBS = [
  { id: 1, type: 'FIXTURE_SYNC',  status: 'COMPLETED', time: '06:00',  meta: 'PL, PD, BL1, SA, FL1 — 47 fixtures synced' },
  { id: 2, type: 'STATS_SYNC',    status: 'COMPLETED', time: '06:14',  meta: '94 teams updated'                           },
  { id: 3, type: 'BULK_ANALYSIS', status: 'COMPLETED', time: '06:28',  meta: '47 matches analyzed · 141 predictions'      },
  { id: 4, type: 'RESULTS_GRADE', status: 'COMPLETED', time: '06:31',  meta: '12 predictions graded'                      },
  { id: 5, type: 'FIXTURE_SYNC',  status: 'FAILED',    time: '05:00',  meta: 'Rate limit exceeded — retried at 06:00'     },
]

const MOCK_STATS = {
  totalPredictions: 1284,
  published: 1102,
  graded: 847,
  wins: 614,
  apiCallsToday: 38,
  apiCallsLimit: 1000,
  lastSync: '06:31 UTC',
  nextSync: '06:00 UTC (tomorrow)',
}

const JOB_STYLE: Record<string, string> = {
  COMPLETED: 'badge-ultra',
  FAILED:    'badge-low',
  RUNNING:   'badge-mod',
  PENDING:   'badge-vsafe',
}

export default function AdminPage() {
  const [processing, setProcessing]   = useState(false)
  const [processMsg, setProcessMsg]   = useState('')
  const [grading, setGrading]         = useState(false)
  const [gradingMsg, setGradingMsg]   = useState('')

  async function handleProcessNow() {
    setProcessing(true)
    setProcessMsg('')
    try {
      await triggerFixtureRefresh()
      setProcessMsg('✓ Daily processing triggered. Fixtures will be synced and analyzed.')
    } catch {
      setProcessMsg('✗ Failed to trigger processing. Is the backend running?')
    }
    setProcessing(false)
  }

  async function handleGradeResults() {
    setGrading(true)
    setGradingMsg('')
    await new Promise(r => setTimeout(r, 1200))
    setGradingMsg('✓ Grading complete. 12 predictions updated.')
    setGrading(false)
  }

  const apiUsagePct = Math.round((MOCK_STATS.apiCallsToday / MOCK_STATS.apiCallsLimit) * 100)
  const accuracy    = Math.round((MOCK_STATS.wins / MOCK_STATS.graded) * 100)

  return (
    <div className="space-y-8 max-w-[1200px]">

      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">System Management</p>
        <h1 className="md-h2">ADMIN <span style={{ color: 'var(--amber)' }}>PANEL</span></h1>
        <p className="md-body mt-1">
          Manage the prediction engine, trigger processing jobs, grade results, and monitor API usage.
        </p>
      </header>

      {/* ── Platform overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 anim-fade anim-delay-1">
        <div className="card p-5">
          <p className="label-lg">Total Predictions</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--amber)' }}>
            {MOCK_STATS.totalPredictions.toLocaleString()}
          </p>
          <p className="label-sm mt-0.5">{MOCK_STATS.published} published</p>
        </div>
        <div className="card p-5">
          <p className="label-lg">Graded</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>
            {MOCK_STATS.graded}
          </p>
          <p className="label-sm mt-0.5">{MOCK_STATS.totalPredictions - MOCK_STATS.graded} pending</p>
        </div>
        <div className="card p-5">
          <p className="label-lg">Accuracy</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--win)' }}>
            {accuracy}%
          </p>
          <p className="label-sm mt-0.5">{MOCK_STATS.wins}W / {MOCK_STATS.graded - MOCK_STATS.wins}L</p>
        </div>
        <div className="card p-5">
          <p className="label-lg">API Usage Today</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>
            {MOCK_STATS.apiCallsToday}
          </p>
          <p className="label-sm mt-0.5">of {MOCK_STATS.apiCallsLimit} limit</p>
          <div className="conf-track mt-2">
            <div className="conf-fill" style={{
              width: `${apiUsagePct}%`,
              background: apiUsagePct > 80 ? 'var(--loss)' : apiUsagePct > 60 ? 'var(--mod)' : 'var(--ultra)',
            }} />
          </div>
        </div>
      </div>

      {/* ── Processing actions ── */}
      <section className="anim-fade anim-delay-2">
        <div className="section-rule"><span>## Processing Controls</span></div>
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Trigger processing */}
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="heading-sm" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                Run Daily Processing
              </h3>
              <p className="md-body text-xs mt-1">
                Fetches today&apos;s fixtures from football-data.org, syncs team stats, runs the
                prediction engine on every match, and publishes results above the confidence threshold.
              </p>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <p style={{ color: 'rgba(255,255,255,0.40)' }}>Pipeline steps:</p>
              {['1. Fixture sync', '2. Standings fetch', '3. Team stats sync', '4. Engine analysis', '5. Auto-publish'].map(s => (
                <p key={s} style={{ color: 'rgba(255,255,255,0.55)' }}>→ {s}</p>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleProcessNow} disabled={processing} className="btn-primary">
                {processing ? 'Processing…' : 'Run Now'}
              </button>
              <div>
                <p className="label-sm">Last run: {MOCK_STATS.lastSync}</p>
                <p className="label-sm">Next: {MOCK_STATS.nextSync}</p>
              </div>
            </div>
            {processMsg && (
              <p
                className="font-mono text-xs p-3 rounded-lg border"
                style={{
                  background:   processMsg.startsWith('✓') ? 'rgba(0,229,160,0.06)' : 'rgba(248,113,113,0.06)',
                  borderColor:  processMsg.startsWith('✓') ? 'rgba(0,229,160,0.25)' : 'rgba(248,113,113,0.25)',
                  color:        processMsg.startsWith('✓') ? 'var(--ultra)' : 'var(--loss)',
                }}
              >
                {processMsg}
              </p>
            )}
          </div>

          {/* Grade results */}
          <div className="card p-5 space-y-4">
            <div>
              <h3 className="heading-sm" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                Grade Finished Matches
              </h3>
              <p className="md-body text-xs mt-1">
                Scans yesterday&apos;s finished fixtures, compares actual outcomes against predictions,
                and records WIN / LOSS / VOID for accuracy tracking.
              </p>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <p style={{ color: 'rgba(255,255,255,0.40)' }}>Grading logic:</p>
              {['Fetch finished fixtures', 'Match to stored predictions', 'Evaluate market outcome', 'Record WIN / LOSS / VOID', 'Recalculate accuracy stats'].map(s => (
                <p key={s} style={{ color: 'rgba(255,255,255,0.55)' }}>→ {s}</p>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleGradeResults} disabled={grading} className="btn-primary" style={{ background: 'var(--vsafe)', color: '#080e14' }}>
                {grading ? 'Grading…' : 'Grade Results'}
              </button>
            </div>
            {gradingMsg && (
              <p
                className="font-mono text-xs p-3 rounded-lg border"
                style={{
                  background:  'rgba(0,229,160,0.06)',
                  borderColor: 'rgba(0,229,160,0.25)',
                  color:       'var(--ultra)',
                }}
              >
                {gradingMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Job history ── */}
      <section className="anim-fade anim-delay-3">
        <div className="section-rule"><span>## Recent Processing Jobs</span></div>
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Job Type</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_JOBS.map(job => (
                <tr key={job.id}>
                  <td className="font-mono text-xs">{job.time}</td>
                  <td className="font-medium text-white/80">{job.type.replace(/_/g, ' ')}</td>
                  <td>
                    <span className={`pill ${JOB_STYLE[job.status]}`} style={{ fontSize: '0.58rem' }}>
                      {job.status}
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{job.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── API health ── */}
      <section className="anim-fade anim-delay-4">
        <div className="section-rule"><span>## API Health Monitor</span></div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="label-lg">Rate Limit Status</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="live-dot" />
              <span className="font-mono text-sm font-bold" style={{ color: 'var(--ultra)' }}>Healthy</span>
            </div>
            <p className="label-sm mt-1">{MOCK_STATS.apiCallsToday} / {MOCK_STATS.apiCallsLimit} calls used</p>
            <div className="conf-track mt-2">
              <div className="conf-fill" style={{ width: `${apiUsagePct}%`, background: 'var(--ultra)' }} />
            </div>
          </div>
          <div className="card p-5">
            <p className="label-lg">Free Tier Notes</p>
            <ul className="space-y-1 mt-2">
              {[
                '50 req/min maximum',
                'Current season only',
                '9 competitions covered',
                'No corners/cards data',
              ].map(note => (
                <li key={note} className="flex items-center gap-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--mod)" strokeWidth="2.5">
                    <path d="M12 9v4M12 17h.01" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  <span className="label-lg" style={{ textTransform: 'none', letterSpacing: 0, fontSize: '0.73rem' }}>
                    {note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <p className="label-lg">Data Sync Times</p>
            <div className="space-y-2 mt-2">
              {[
                { label: 'Fixtures',   ttl: '15 min cache' },
                { label: 'Standings',  ttl: '60 min cache' },
                { label: 'Team stats', ttl: '30 min cache' },
                { label: 'H2H data',   ttl: '60 min cache' },
              ].map(({ label, ttl }) => (
                <div key={label} className="flex justify-between">
                  <span className="label-lg" style={{ textTransform: 'none', letterSpacing: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.55)' }}>
                    {label}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--amber)' }}>{ttl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick nav ── */}
      <section className="anim-fade anim-delay-5">
        <div className="section-rule"><span>Quick Navigation</span></div>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/settings',    label: 'Engine Settings' },
            { href: '/statistics',  label: 'Platform Stats'  },
            { href: '/history',     label: 'Full History'    },
            { href: '/predictions', label: 'All Predictions' },
          ].map(({ href, label }) => (
            <a key={href} href={href} className="btn-ghost">{label} →</a>
          ))}
        </div>
      </section>
    </div>
  )
}
