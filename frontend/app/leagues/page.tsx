// app/leagues/page.tsx — Top Leagues
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'

const LEAGUES = [
  {
    code: 'PL',  name: 'Premier League', country: 'England',
    trend: 'Attacking', style: 'High-tempo with strong aerial threats and fast transitions.',
    avgGoals: 2.81, homeWin: 44, btts: 52, corners: 10.8,
    markets: ['Over 2.5 Goals', 'Home Win', 'BTTS'],
  },
  {
    code: 'PD',  name: 'La Liga', country: 'Spain',
    trend: 'Balanced', style: 'Possession-based with mid-block defending and counter threat.',
    avgGoals: 2.54, homeWin: 42, btts: 49, corners: 9.4,
    markets: ['Home DNB', 'Under 3.5 Goals', 'Corners 9.5+'],
  },
  {
    code: 'BL1', name: 'Bundesliga', country: 'Germany',
    trend: 'Open', style: 'High press, high scoring — most goals per game in Europe.',
    avgGoals: 3.05, homeWin: 40, btts: 57, corners: 10.1,
    markets: ['Over 2.5 Goals', 'BTTS', 'Over 3.5 Goals'],
  },
  {
    code: 'SA',  name: 'Serie A', country: 'Italy',
    trend: 'Defensive', style: 'Tactical and tight — lowest BTTS rate, high clean sheet frequency.',
    avgGoals: 2.52, homeWin: 43, btts: 46, corners: 9.7,
    markets: ['Home Win', 'Under 2.5 Goals', 'BTTS No'],
  },
  {
    code: 'FL1', name: 'Ligue 1', country: 'France',
    trend: 'Moderate', style: 'PSG dominance skews home win rates; rest of league is competitive.',
    avgGoals: 2.61, homeWin: 41, btts: 48, corners: 9.9,
    markets: ['Over 1.5 Goals', 'Home Win', 'Cards 2.5+'],
  },
]

export default function LeaguesPage() {
  return (
    <div className="space-y-8 max-w-[1200px]">
      <header className="anim-fade">
        <p className="label-xl mb-1">League Intelligence</p>
        <h1 className="md-h2">TOP <span style={{ color: 'var(--amber)' }}>LEAGUES</span></h1>
        <p className="md-body mt-1">
          League-specific baselines, scoring trends, and optimal markets used by the prediction engine.
        </p>
      </header>

      <div className="grid gap-5">
        {LEAGUES.map((l, i) => (
          <div
            key={l.code}
            className={`card p-6 anim-fade anim-delay-${Math.min(i + 1, 5)}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.25)' }}>{l.code}</span>
                  <h2 className="heading-md" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>{l.name}</h2>
                </div>
                <p className="label-lg mt-1">{l.country} · Trend: <span style={{ color: 'var(--amber)' }}>{l.trend}</span></p>
                <p className="md-body text-xs mt-1.5">{l.style}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="label-sm">Best Markets</p>
                <div className="flex flex-wrap gap-1 mt-1 justify-end">
                  {l.markets.map(m => (
                    <span key={m} className="pill badge-vsafe" style={{ fontSize: '0.58rem' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            <hr className="section-hr" />

            {/* Stats bars */}
            <div className="grid sm:grid-cols-4 gap-4 mt-4">
              <ConfidenceBar label="Avg Goals/Match" value={(l.avgGoals / 4) * 100} color="var(--amber)" />
              <ConfidenceBar label="Home Win Rate"   value={l.homeWin}             color="var(--vsafe)"  />
              <ConfidenceBar label="BTTS Rate"       value={l.btts}                color="var(--ultra)"  />
              <ConfidenceBar label="Corner Avg"      value={(l.corners / 15) * 100} color="var(--safe)"  />
            </div>

            {/* Raw numbers */}
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-dim)' }}>
              <span className="label-lg">Goals: <strong className="text-white/80 font-mono">{l.avgGoals}</strong></span>
              <span className="label-lg">Home Win: <strong className="text-white/80 font-mono">{l.homeWin}%</strong></span>
              <span className="label-lg">BTTS: <strong className="text-white/80 font-mono">{l.btts}%</strong></span>
              <span className="label-lg">Corners: <strong className="text-white/80 font-mono">{l.corners}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
