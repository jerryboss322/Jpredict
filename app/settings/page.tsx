'use client'
import { useState } from 'react'

const ALL_LEAGUES = [
  // Domestic
  { code: 'PL',  name: 'Premier League',          country: 'England',       type: 'league' },
  { code: 'PD',  name: 'La Liga',                 country: 'Spain',         type: 'league' },
  { code: 'BL1', name: 'Bundesliga',               country: 'Germany',       type: 'league' },
  { code: 'SA',  name: 'Serie A',                  country: 'Italy',         type: 'league' },
  { code: 'FL1', name: 'Ligue 1',                  country: 'France',        type: 'league' },
  { code: 'DED', name: 'Eredivisie',               country: 'Netherlands',   type: 'league' },
  { code: 'PPL', name: 'Primeira Liga',            country: 'Portugal',      type: 'league' },
  { code: 'ELC', name: 'Championship',             country: 'England',       type: 'league' },
  { code: 'BSA', name: 'Brasileirão Serie A',      country: 'Brazil',        type: 'league' },
  // European cups
  { code: 'CL',  name: 'UEFA Champions League',   country: 'Europe',        type: 'cup' },
  { code: 'EL',  name: 'UEFA Europa League',       country: 'Europe',        type: 'cup' },
  { code: 'EC',  name: 'UEFA Conference League',   country: 'Europe',        type: 'cup' },
  { code: 'CLI', name: 'Copa Libertadores',        country: 'South America', type: 'cup' },
  // International
  { code: 'WC',  name: 'FIFA World Cup',           country: 'International', type: 'international' },
  { code: 'NL',  name: 'UEFA Nations League',      country: 'Europe',        type: 'international' },
]

const TYPE_GROUPS = [
  { key: 'league',        label: 'Domestic Leagues'            },
  { key: 'cup',           label: 'European Club Competitions'  },
  { key: 'international', label: 'International Tournaments'   },
]

const DEFAULT_ACTIVE = ['PL','PD','BL1','SA','FL1','DED','PPL','ELC','CL','EL','EC','NL','WC']

export default function SettingsPage() {
  const [apiKey, setApiKey]           = useState('')
  const [minConf, setMinConf]         = useState(80)
  const [maxPreds, setMaxPreds]       = useState(3)
  const [autoPublish, setAutoPublish] = useState(true)
  const [active, setActive]           = useState<string[]>(DEFAULT_ACTIVE)
  const [saved, setSaved]             = useState(false)
  const [saving, setSaving]           = useState(false)

  const toggleLeague = (code: string) =>
    setActive(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-8 max-w-[900px]">
      <header className="anim-fade">
        <p className="label-xl mb-1">Engine Configuration</p>
        <h1 className="md-h2">PLATFORM <span style={{ color: 'var(--amber)' }}>SETTINGS</span></h1>
        <p className="md-body mt-1">
          Configure your API token, confidence thresholds, and which competitions to analyze daily.
        </p>
      </header>

      {/* ── API Token ── */}
      <section className="card p-6 space-y-4 anim-fade anim-delay-1">
        <div>
          <p className="label-xl mb-0.5">## API Configuration</p>
          <hr className="section-hr" />
          <p className="md-body text-xs mt-2">
            On Vercel, set <code className="font-mono text-xs" style={{ color: 'var(--amber)' }}>FOOTBALL_DATA_API_KEY</code> in
            {' '}Project → Settings → Environment Variables. Visit{' '}
            <a href="/api/debug" target="_blank" style={{ color: 'var(--amber)' }} className="hover:underline">
              /api/debug
            </a>
            {' '}to verify it&apos;s working.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="label-lg block">football-data.org API Token</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Only needed for local dev — use env vars on Vercel"
            className="input-base w-full"
          />
        </div>
      </section>

      {/* ── Confidence Thresholds ── */}
      <section className="card p-6 space-y-5 anim-fade anim-delay-2">
        <div>
          <p className="label-xl mb-0.5">## Confidence Thresholds</p>
          <hr className="section-hr" />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { label: 'Ultra Safe ≥',  val: 95, color: 'var(--ultra)' },
            { label: 'Very Safe ≥',   val: 90, color: 'var(--vsafe)' },
            { label: 'Safe ≥',        val: 85, color: 'var(--safe)'  },
            { label: 'Moderate ≥',    val: 80, color: 'var(--mod)'   },
          ].map(t => (
            <div key={t.label} className="space-y-1.5">
              <div className="flex justify-between">
                <label className="label-lg">{t.label}</label>
                <span className="font-mono text-sm font-bold" style={{ color: t.color }}>{t.val}%</span>
              </div>
              <div className="conf-track">
                <div className="conf-fill" style={{ width: `${t.val}%`, background: t.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-dim)' }}>
          <div className="flex justify-between">
            <label className="label-lg">Minimum Publish Threshold</label>
            <span className="font-mono text-sm font-bold" style={{ color: 'var(--amber)' }}>{minConf}%</span>
          </div>
          <input type="range" min={50} max={95} value={minConf}
            onChange={e => setMinConf(parseInt(e.target.value))}
            className="w-full" style={{ accentColor: 'var(--amber)' }} />
          <p className="md-body text-xs">Predictions below this are discarded. Set via <code className="font-mono text-xs" style={{ color: 'var(--amber)' }}>MIN_CONFIDENCE</code> env var on Vercel.</p>
        </div>
      </section>

      {/* ── Active Competitions ── */}
      <section className="card p-6 space-y-5 anim-fade anim-delay-3">
        <div>
          <p className="label-xl mb-0.5">## Active Competitions</p>
          <hr className="section-hr" />
          <p className="md-body text-xs mt-2">
            All competitions below are available on the football-data.org free tier.
            World Cup and Nations League only return fixtures during active tournament windows.
            Set via <code className="font-mono text-xs" style={{ color: 'var(--amber)' }}>ACTIVE_LEAGUES</code> env var (comma-separated codes).
          </p>
        </div>

        {TYPE_GROUPS.map(group => (
          <div key={group.key} className="space-y-2">
            <p className="label-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>{group.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_LEAGUES.filter(l => l.type === group.key).map(({ code, name, country }) => {
                const on = active.includes(code)
                return (
                  <button key={code} onClick={() => toggleLeague(code)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all"
                    style={{
                      background:  on ? 'rgba(245,166,35,0.08)' : 'var(--bg-rim)',
                      borderColor: on ? 'rgba(245,166,35,0.30)' : 'var(--border-dim)',
                      color:       on ? 'var(--amber)' : 'rgba(255,255,255,0.45)',
                    }}>
                    <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                      style={{ background: on ? 'var(--amber)' : 'transparent', borderColor: on ? 'var(--amber)' : 'rgba(255,255,255,0.20)' }}>
                      {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#080e14" strokeWidth="3.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-none truncate">{name}</p>
                      <p className="font-mono text-[10px] mt-0.5 opacity-60">{code} · {country}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-dim)' }}>
          <p className="label-sm">Active: <strong className="font-mono text-white/70">{active.join(', ')}</strong></p>
        </div>
      </section>

      {/* ── Engine ── */}
      <section className="card p-6 space-y-4 anim-fade anim-delay-4">
        <div>
          <p className="label-xl mb-0.5">## Engine Behaviour</p>
          <hr className="section-hr" />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="label-lg block">Max Predictions Per Match</label>
            <select value={maxPreds} onChange={e => setMaxPreds(parseInt(e.target.value))} className="input-base w-full">
              {[1,2,3].map(n => <option key={n} value={n}>{n} prediction{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-rim)' }}>
            <div>
              <p className="text-sm font-medium text-white/80">Auto-publish</p>
              <p className="label-sm">Publish predictions above threshold automatically</p>
            </div>
            <button onClick={() => setAutoPublish(!autoPublish)}
              className="w-11 h-6 rounded-full transition-all shrink-0"
              style={{ background: autoPublish ? 'var(--amber)' : 'rgba(255,255,255,0.12)' }}>
              <div className="w-4 h-4 rounded-full bg-white mx-1 transition-all"
                style={{ transform: autoPublish ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4 anim-fade anim-delay-5">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && (
          <span className="font-mono text-xs flex items-center gap-1.5" style={{ color: 'var(--ultra)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Settings saved
          </span>
        )}
        <a href="/api/debug" target="_blank" className="btn-ghost text-xs">
          Test API Connection →
        </a>
      </div>
    </div>
  )
}
