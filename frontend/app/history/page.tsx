// app/history/page.tsx — Prediction History
// Note: This page shows the stored history from your backend.
// For now it uses your existing hardcoded records as a visual template,
// wire to a real DB endpoint when your persistence layer is ready.

const HISTORY = [
  { id: 1, fixture: 'Manchester City vs Everton',  competition: 'Premier League', prediction: 'Over 1.5 Goals',    confidence: 94, result: 'WIN',    date: '2024-12-01' },
  { id: 2, fixture: 'Real Madrid vs Barcelona',    competition: 'La Liga',         prediction: 'BTTS',              confidence: 91, result: 'WIN',    date: '2024-12-02' },
  { id: 3, fixture: 'Napoli vs Juventus',          competition: 'Serie A',         prediction: 'Home Win',          confidence: 88, result: 'LOSS',   date: '2024-12-03' },
  { id: 4, fixture: 'Bayern vs Dortmund',          competition: 'Bundesliga',      prediction: 'Over 2.5 Goals',    confidence: 86, result: 'WIN',    date: '2024-12-04' },
  { id: 5, fixture: 'PSG vs Marseille',            competition: 'Ligue 1',         prediction: 'Home Draw No Bet',  confidence: 84, result: 'WIN',    date: '2024-12-05' },
  { id: 6, fixture: 'Arsenal vs Chelsea',          competition: 'Premier League',  prediction: 'Over 1.5 Goals',    confidence: 91, result: 'WIN',    date: '2024-12-06' },
  { id: 7, fixture: 'Atletico vs Sevilla',         competition: 'La Liga',         prediction: 'Under 4.5 Goals',   confidence: 83, result: 'WIN',    date: '2024-12-07' },
  { id: 8, fixture: 'AC Milan vs Inter',           competition: 'Serie A',         prediction: 'BTTS',              confidence: 87, result: 'LOSS',   date: '2024-12-08' },
]

const wins  = HISTORY.filter(h => h.result === 'WIN').length
const total = HISTORY.length
const acc   = Math.round((wins / total) * 100)

const RESULT_STYLE = {
  WIN:  { label: 'WIN',  cls: 'badge-ultra' },
  LOSS: { label: 'LOSS', cls: 'badge-low'   },
  VOID: { label: 'VOID', cls: 'badge-mod'   },
}

const SAFETY = (c: number) =>
  c >= 95 ? 'Ultra Safe'
  : c >= 90 ? 'Very Safe'
  : c >= 85 ? 'Safe'
  : 'Moderate'

const SAFETY_CLS = (c: number) =>
  c >= 95 ? 'badge-ultra'
  : c >= 90 ? 'badge-vsafe'
  : c >= 85 ? 'badge-safe'
  : 'badge-mod'

export default function HistoryPage() {
  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">Historical Record</p>
        <h1 className="md-h2">PREDICTION <span style={{ color: 'var(--amber)' }}>HISTORY</span></h1>
        <p className="md-body mt-1">
          All previously generated and settled predictions with win/loss outcomes.
        </p>
      </header>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-fade anim-delay-1">
        <div className="card p-5">
          <p className="label-lg">Accuracy</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--amber)' }}>
            {acc}%
          </p>
        </div>
        <div className="card p-5">
          <p className="label-lg">Total</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>{total}</p>
        </div>
        <div className="card p-5">
          <p className="label-lg">Wins</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--win)' }}>{wins}</p>
        </div>
        <div className="card p-5">
          <p className="label-lg">Losses</p>
          <p className="stat-number mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--loss)' }}>{total - wins}</p>
        </div>
      </div>

      {/* ── Win rate bar ── */}
      <div className="card p-5 anim-fade anim-delay-2">
        <div className="flex justify-between items-center mb-2">
          <p className="label-lg">Win Rate</p>
          <p className="font-mono text-sm font-bold" style={{ color: 'var(--win)' }}>{wins}W / {total - wins}L</p>
        </div>
        <div className="conf-track" style={{ height: '8px', borderRadius: '4px' }}>
          <div className="conf-fill" style={{ width: `${acc}%`, background: 'var(--win)', borderRadius: '4px' }} />
        </div>
      </div>

      {/* ── History table ── */}
      <section className="anim-fade anim-delay-3">
        <div className="section-rule"><span>## Settled Predictions</span></div>
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Match</th>
                <th>League</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Safety</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map(h => {
                const res = RESULT_STYLE[h.result as keyof typeof RESULT_STYLE]
                return (
                  <tr key={h.id}>
                    <td className="font-mono text-xs">{h.date}</td>
                    <td className="font-medium text-white/85 text-sm">{h.fixture}</td>
                    <td className="text-xs">{h.competition}</td>
                    <td style={{ color: 'var(--amber)' }} className="font-medium text-sm">{h.prediction}</td>
                    <td className="font-mono font-bold text-sm">{h.confidence}%</td>
                    <td>
                      <span className={`pill ${SAFETY_CLS(h.confidence)}`} style={{ fontSize: '0.58rem' }}>
                        {SAFETY(h.confidence)}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${res.cls}`} style={{ fontSize: '0.58rem' }}>{res.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="md-body text-xs mt-3">
          * Connect this page to your database to display live historical records.
          Wire the <code className="font-mono text-xs" style={{ color: 'var(--amber)' }}>/api/history</code> endpoint when your persistence layer is ready.
        </p>
      </section>
    </div>
  )
}
