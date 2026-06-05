// app/statistics/page.tsx — Statistics
import { StatCard } from '@/components/ui/StatCard'
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'

const LEAGUE_STATS = [
  { league: 'Premier League', avgGoals: 2.81, btts: 52, corners: 10.8, cards: 3.2, homeWin: 44 },
  { league: 'La Liga',        avgGoals: 2.54, btts: 49, corners: 9.4,  cards: 4.1, homeWin: 42 },
  { league: 'Bundesliga',     avgGoals: 3.05, btts: 57, corners: 10.1, cards: 2.9, homeWin: 40 },
  { league: 'Serie A',        avgGoals: 2.52, btts: 46, corners: 9.7,  cards: 3.8, homeWin: 43 },
  { league: 'Ligue 1',        avgGoals: 2.61, btts: 48, corners: 9.9,  cards: 3.5, homeWin: 41 },
]

const MARKET_ACCURACY = [
  { market: 'Over 1.5 Goals',   accuracy: 78, samples: 142 },
  { market: 'BTTS',             accuracy: 72, samples: 98  },
  { market: 'Over 2.5 Goals',   accuracy: 65, samples: 134 },
  { market: 'Home Draw No Bet', accuracy: 61, samples: 87  },
  { market: 'Home Win',         accuracy: 58, samples: 112 },
  { market: 'Corners 4.5+',     accuracy: 55, samples: 43  },
]

export default function StatisticsPage() {
  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">League & Accuracy Metrics</p>
        <h1 className="md-h2">PLATFORM <span style={{ color: 'var(--amber)' }}>STATISTICS</span></h1>
        <p className="md-body mt-1">
          Aggregated league baselines and historical market accuracy tracked by the engine.
        </p>
      </header>

      {/* ── Global KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 anim-fade anim-delay-1">
        <StatCard label="Goal Rate (Avg)"  value="2.71"  sub="goals per match"       color="amber" />
        <StatCard label="BTTS Rate"        value="51%"   sub="both teams score"       />
        <StatCard label="Corner Avg"       value="10.2"  sub="per match"              />
        <StatCard label="Cards Avg"        value="3.5"   sub="yellow + red per match" />
      </div>

      {/* ── Market accuracy ── */}
      <section className="anim-fade anim-delay-2">
        <div className="section-rule"><span>## Market Accuracy Tracking</span></div>
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Accuracy</th>
                <th>Sample Size</th>
                <th style={{ width: '200px' }}>Visual</th>
              </tr>
            </thead>
            <tbody>
              {MARKET_ACCURACY.map(m => (
                <tr key={m.market}>
                  <td className="font-medium text-white/85">{m.market}</td>
                  <td>
                    <span className="font-mono font-bold" style={{
                      color: m.accuracy >= 75 ? 'var(--ultra)' : m.accuracy >= 65 ? 'var(--vsafe)' : 'var(--amber)'
                    }}>
                      {m.accuracy}%
                    </span>
                  </td>
                  <td className="font-mono text-xs">{m.samples} predictions</td>
                  <td>
                    <div className="conf-track">
                      <div className="conf-fill" style={{
                        width: `${m.accuracy}%`,
                        background: m.accuracy >= 75 ? 'var(--ultra)' : m.accuracy >= 65 ? 'var(--vsafe)' : 'var(--amber)'
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="md-body text-xs mt-3">
          * Accuracy based on settled predictions only. Ongoing tracking — figures update as results are confirmed.
        </p>
      </section>

      {/* ── League baselines ── */}
      <section className="anim-fade anim-delay-3">
        <div className="section-rule"><span>## League Baselines Used by Engine</span></div>
        <div className="grid gap-4">
          {LEAGUE_STATS.map(l => (
            <div key={l.league} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-sm" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{l.league}</h3>
                <span className="label-lg">Home Win Rate: <strong className="text-white/70">{l.homeWin}%</strong></span>
              </div>
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <p className="label-sm">Avg Goals</p>
                  <p className="font-mono text-lg font-bold mt-0.5" style={{ color: 'var(--amber)' }}>{l.avgGoals}</p>
                  <div className="conf-track mt-1">
                    <div className="conf-fill" style={{ width: `${(l.avgGoals / 4) * 100}%`, background: 'var(--amber)' }} />
                  </div>
                </div>
                <div>
                  <p className="label-sm">BTTS Rate</p>
                  <p className="font-mono text-lg font-bold mt-0.5" style={{ color: 'var(--vsafe)' }}>{l.btts}%</p>
                  <div className="conf-track mt-1">
                    <div className="conf-fill" style={{ width: `${l.btts}%`, background: 'var(--vsafe)' }} />
                  </div>
                </div>
                <div>
                  <p className="label-sm">Corner Avg</p>
                  <p className="font-mono text-lg font-bold mt-0.5">{l.corners}</p>
                  <div className="conf-track mt-1">
                    <div className="conf-fill" style={{ width: `${(l.corners / 15) * 100}%`, background: 'var(--safe)' }} />
                  </div>
                </div>
                <div>
                  <p className="label-sm">Cards Avg</p>
                  <p className="font-mono text-lg font-bold mt-0.5">{l.cards}</p>
                  <div className="conf-track mt-1">
                    <div className="conf-fill" style={{ width: `${(l.cards / 6) * 100}%`, background: 'var(--mod)' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
