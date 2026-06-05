// app/team/page.tsx — Team Explorer
import { ConfidenceBar } from '@/components/ui/ConfidenceBar'

const TEAMS = [
  {
    name: 'Manchester City', league: 'Premier League', country: 'England',
    form: ['W', 'W', 'D', 'W', 'W'],
    style: 'High-press positional play with fluid attacking movement and elite corner delivery.',
    stats: { goalsFor: 2.4, goalsAgainst: 0.9, cleanSheets: 62, cornersFor: 6.8, cards: 1.4 },
    strengths: ['Corners', 'Home Win', 'Clean Sheet'],
  },
  {
    name: 'Real Madrid', league: 'La Liga', country: 'Spain',
    form: ['W', 'D', 'W', 'D', 'W'],
    style: 'Counter-attack mastery combined with set-piece threat and defensive resilience.',
    stats: { goalsFor: 2.1, goalsAgainst: 1.0, cleanSheets: 51, cornersFor: 5.2, cards: 1.9 },
    strengths: ['Home DNB', 'BTTS No', 'Over 1.5'],
  },
  {
    name: 'Bayern Munich', league: 'Bundesliga', country: 'Germany',
    form: ['W', 'W', 'W', 'D', 'W'],
    style: 'Gegenpressing dominance — most goals scored and highest over 2.5 rate in the Bundesliga.',
    stats: { goalsFor: 3.1, goalsAgainst: 1.2, cleanSheets: 44, cornersFor: 7.3, cards: 2.0 },
    strengths: ['Over 2.5 Goals', 'BTTS', 'Home Win'],
  },
  {
    name: 'Napoli', league: 'Serie A', country: 'Italy',
    form: ['W', 'W', 'W', 'D', 'W'],
    style: 'Aggressive corner winning and compact defensive shape with lethal set-piece conversion.',
    stats: { goalsFor: 2.2, goalsAgainst: 0.8, cleanSheets: 58, cornersFor: 6.4, cards: 1.7 },
    strengths: ['Corners 4.5+', 'Clean Sheet', 'Home Win'],
  },
  {
    name: 'PSG', league: 'Ligue 1', country: 'France',
    form: ['W', 'W', 'W', 'W', 'D'],
    style: 'Star-driven individual brilliance — dominant home record, high goals in most fixtures.',
    stats: { goalsFor: 2.9, goalsAgainst: 0.7, cleanSheets: 68, cornersFor: 5.9, cards: 2.2 },
    strengths: ['Home Win', 'Over 2.5 Goals', 'Clean Sheet'],
  },
  {
    name: 'Barcelona', league: 'La Liga', country: 'Spain',
    form: ['W', 'D', 'W', 'D', 'W'],
    style: 'Tiki-taka build-up with high possession and progressive passing into dangerous zones.',
    stats: { goalsFor: 2.3, goalsAgainst: 1.1, cleanSheets: 48, cornersFor: 6.0, cards: 2.5 },
    strengths: ['BTTS', 'Over 1.5 Goals', 'Corners'],
  },
]

const FORM_COLOR = { W: 'var(--win)', D: 'var(--mod)', L: 'var(--loss)' }

export default function TeamExplorerPage() {
  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">Club Form & Trends</p>
        <h1 className="md-h2">TEAM <span style={{ color: 'var(--amber)' }}>EXPLORER</span></h1>
        <p className="md-body mt-1">
          Club-level form analysis, scoring profiles, and recommended markets used by the engine.
        </p>
      </header>

      {/* ── Team grid ── */}
      <div className="grid md:grid-cols-2 gap-5">
        {TEAMS.map((team, i) => (
          <article
            key={team.name}
            className={`card p-5 space-y-4 anim-fade anim-delay-${Math.min(i + 1, 5)}`}
          >
            {/* Team header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="font-display text-white leading-none"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', letterSpacing: '0.04em' }}
                >
                  {team.name}
                </h2>
                <p className="label-lg mt-0.5">{team.league} · {team.country}</p>
              </div>
              {/* Form pills */}
              <div className="flex gap-1 shrink-0">
                {team.form.map((r, idx) => (
                  <span
                    key={idx}
                    className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold"
                    style={{ background: `${FORM_COLOR[r as keyof typeof FORM_COLOR]}20`, color: FORM_COLOR[r as keyof typeof FORM_COLOR], border: `1px solid ${FORM_COLOR[r as keyof typeof FORM_COLOR]}40` }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <p className="md-body text-xs leading-relaxed">{team.style}</p>

            <hr className="section-hr" />

            {/* Stats bars */}
            <div className="space-y-2.5">
              <ConfidenceBar label="Goals Scored/Match"  value={(team.stats.goalsFor / 4) * 100}  color="var(--amber)" />
              <ConfidenceBar label="Goals Conceded/Match" value={(team.stats.goalsAgainst / 4) * 100} color="var(--loss)"  />
              <ConfidenceBar label="Clean Sheet Rate"    value={team.stats.cleanSheets}             color="var(--ultra)" />
              <ConfidenceBar label="Corner Avg/Match"    value={(team.stats.cornersFor / 10) * 100} color="var(--vsafe)" />
            </div>

            <hr className="section-hr" />

            {/* Raw stats row */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="label-sm">Goals/Game</p>
                <p className="font-mono text-sm font-bold mt-0.5" style={{ color: 'var(--amber)' }}>
                  {team.stats.goalsFor}
                </p>
              </div>
              <div>
                <p className="label-sm">Conceded/Game</p>
                <p className="font-mono text-sm font-bold mt-0.5" style={{ color: 'var(--loss)' }}>
                  {team.stats.goalsAgainst}
                </p>
              </div>
              <div>
                <p className="label-sm">Corners/Game</p>
                <p className="font-mono text-sm font-bold mt-0.5">{team.stats.cornersFor}</p>
              </div>
              <div>
                <p className="label-sm">Cards/Game</p>
                <p className="font-mono text-sm font-bold mt-0.5">{team.stats.cards}</p>
              </div>
            </div>

            {/* Best markets */}
            <div>
              <p className="label-sm mb-1.5">Strongest Markets</p>
              <div className="flex flex-wrap gap-1.5">
                {team.strengths.map((m) => (
                  <span key={m} className="pill badge-vsafe" style={{ fontSize: '0.58rem' }}>{m}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
