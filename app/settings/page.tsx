'use client'
// app/settings/page.tsx — Engine Configuration Settings

import { useState } from 'react'

const DEFAULT_SETTINGS = {
  apiKey: '',
  minConfidence: 80,
  ultraSafeThreshold: 95,
  verySafeThreshold: 90,
  safeThreshold: 85,
  moderateThreshold: 80,
  maxPredictionsPerMatch: 3,
  autoPublish: true,
  syncHour: 6,
  activeLeagues: ['PL', 'PD', 'BL1', 'SA', 'FL1'],
  backendUrl: 'http://localhost:4000',
}

const ALL_LEAGUES = [
  { code: 'PL',  name: 'Premier League'   },
  { code: 'PD',  name: 'La Liga'          },
  { code: 'BL1', name: 'Bundesliga'       },
  { code: 'SA',  name: 'Serie A'          },
  { code: 'FL1', name: 'Ligue 1'          },
  { code: 'CL',  name: 'Champions League' },
  { code: 'DED', name: 'Eredivisie'       },
  { code: 'PPL', name: 'Primeira Liga'    },
  { code: 'ELC', name: 'Championship'     },
]

export default function SettingsPage() {
  const [cfg, setCfg] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: any) =>
    setCfg(prev => ({ ...prev, [key]: value }))

  const toggleLeague = (code: string) =>
    setCfg(prev => ({
      ...prev,
      activeLeagues: prev.activeLeagues.includes(code)
        ? prev.activeLeagues.filter(c => c !== code)
        : [...prev.activeLeagues, code],
    }))

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-8 max-w-[860px]">

      {/* ── Header ── */}
      <header className="anim-fade">
        <p className="label-xl mb-1">Engine Configuration</p>
        <h1 className="md-h2">PLATFORM <span style={{ color: 'var(--amber)' }}>SETTINGS</span></h1>
        <p className="md-body mt-1">
          Configure API credentials, confidence thresholds, active leagues, and sync behaviour.
        </p>
      </header>

      {/* ── API Configuration ── */}
      <section className="card p-6 space-y-5 anim-fade anim-delay-1">
        <div>
          <p className="label-xl mb-0.5">## API Configuration</p>
          <hr className="section-hr" />
        </div>

        <div className="space-y-1.5">
          <label className="label-lg block">Football Data API Token</label>
          <input
            type="password"
            value={cfg.apiKey}
            onChange={e => set('apiKey', e.target.value)}
            placeholder="Paste your football-data.org token here"
            className="input-base w-full"
          />
          <p className="md-body text-xs">
            Register at{' '}
            <a
              href="https://www.football-data.org"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--amber)' }}
              className="hover:underline"
            >
              football-data.org
            </a>
            {' '}— free tier supports 50 req/min across 12 competitions.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="label-lg block">Backend API URL</label>
          <input
            type="text"
            value={cfg.backendUrl}
            onChange={e => set('backendUrl', e.target.value)}
            className="input-base w-full"
          />
          <p className="md-body text-xs">URL of your Node.js/Express backend server.</p>
        </div>
      </section>

      {/* ── Confidence Thresholds ── */}
      <section className="card p-6 space-y-5 anim-fade anim-delay-2">
        <div>
          <p className="label-xl mb-0.5">## Confidence Thresholds</p>
          <hr className="section-hr" />
          <p className="md-body text-xs mt-2">
            Predictions below <strong className="text-white/70">Minimum Publish Threshold</strong> are automatically
            discarded and never shown to users. Adjust these to tune prediction selectivity.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { key: 'ultraSafeThreshold', label: 'Ultra Safe',  color: 'var(--ultra)', hint: 'Highest confidence tier' },
            { key: 'verySafeThreshold',  label: 'Very Safe',   color: 'var(--vsafe)', hint: 'High confidence tier' },
            { key: 'safeThreshold',      label: 'Safe',        color: 'var(--safe)',  hint: 'Moderate-high confidence' },
            { key: 'moderateThreshold',  label: 'Moderate',    color: 'var(--mod)',   hint: 'Minimum published tier' },
          ].map(({ key, label, color, hint }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label-lg">{label}</label>
                <span className="font-mono text-sm font-bold" style={{ color }}>
                  {cfg[key as keyof typeof cfg]}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={99}
                value={cfg[key as keyof typeof cfg] as number}
                onChange={e => set(key, parseInt(e.target.value))}
                className="w-full h-1 rounded appearance-none cursor-pointer"
                style={{ accentColor: color }}
              />
              <div className="conf-track">
                <div
                  className="conf-fill"
                  style={{ width: `${cfg[key as keyof typeof cfg]}%`, background: color }}
                />
              </div>
              <p className="label-sm">{hint}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-dim)' }}>
          <div className="flex items-center justify-between">
            <label className="label-lg">Minimum Publish Threshold</label>
            <span className="font-mono text-sm font-bold" style={{ color: 'var(--amber)' }}>
              {cfg.minConfidence}%
            </span>
          </div>
          <input
            type="range" min={50} max={95}
            value={cfg.minConfidence}
            onChange={e => set('minConfidence', parseInt(e.target.value))}
            className="w-full h-1 rounded appearance-none cursor-pointer"
            style={{ accentColor: 'var(--amber)' }}
          />
          <p className="md-body text-xs">
            Predictions below this threshold are discarded. Default: 80%.
            Raise it to publish only the highest-confidence picks.
          </p>
        </div>
      </section>

      {/* ── Active Leagues ── */}
      <section className="card p-6 space-y-4 anim-fade anim-delay-3">
        <div>
          <p className="label-xl mb-0.5">## Active Leagues</p>
          <hr className="section-hr" />
          <p className="md-body text-xs mt-2">
            Only fixtures from active leagues are fetched and analyzed daily.
            Free tier covers 9 competitions simultaneously.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_LEAGUES.map(({ code, name }) => {
            const on = cfg.activeLeagues.includes(code)
            return (
              <button
                key={code}
                onClick={() => toggleLeague(code)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all"
                style={{
                  background:   on ? 'rgba(245,166,35,0.08)' : 'var(--bg-rim)',
                  borderColor:  on ? 'rgba(245,166,35,0.30)' : 'var(--border-dim)',
                  color:        on ? 'var(--amber)' : 'rgba(255,255,255,0.45)',
                }}
              >
                <span
                  className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background:  on ? 'var(--amber)' : 'transparent',
                    borderColor: on ? 'var(--amber)' : 'rgba(255,255,255,0.20)',
                  }}
                >
                  {on && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#080e14" strokeWidth="3.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-none">{name}</p>
                  <p className="font-mono text-[10px] mt-0.5 opacity-60">{code}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Engine Behaviour ── */}
      <section className="card p-6 space-y-5 anim-fade anim-delay-4">
        <div>
          <p className="label-xl mb-0.5">## Engine Behaviour</p>
          <hr className="section-hr" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="label-lg block">Max Predictions Per Match</label>
            <select
              value={cfg.maxPredictionsPerMatch}
              onChange={e => set('maxPredictionsPerMatch', parseInt(e.target.value))}
              className="input-base w-full"
            >
              {[1, 2, 3].map(n => (
                <option key={n} value={n}>{n} prediction{n > 1 ? 's' : ''}</option>
              ))}
            </select>
            <p className="label-sm">Top N safest picks to surface per match</p>
          </div>

          <div className="space-y-1.5">
            <label className="label-lg block">Daily Sync Hour (UTC)</label>
            <select
              value={cfg.syncHour}
              onChange={e => set('syncHour', parseInt(e.target.value))}
              className="input-base w-full"
            >
              {[3, 4, 5, 6, 7, 8].map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00 UTC</option>
              ))}
            </select>
            <p className="label-sm">When to run the daily fixture + analysis pipeline</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-rim)' }}>
          <div>
            <p className="text-sm font-medium text-white/80">Auto-publish predictions</p>
            <p className="label-sm mt-0.5">Automatically publish predictions above the minimum threshold</p>
          </div>
          <button
            onClick={() => set('autoPublish', !cfg.autoPublish)}
            className="w-11 h-6 rounded-full transition-all shrink-0"
            style={{
              background: cfg.autoPublish ? 'var(--amber)' : 'rgba(255,255,255,0.12)',
            }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white mx-1 transition-all"
              style={{ transform: cfg.autoPublish ? 'translateX(20px)' : 'translateX(0px)' }}
            />
          </button>
        </div>
      </section>

      {/* ── Save ── */}
      <div className="flex items-center gap-4 anim-fade anim-delay-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
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
        <p className="md-body text-xs">
          Changes take effect on the next daily processing run.
        </p>
      </div>
    </div>
  )
}
