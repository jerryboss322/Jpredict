// lib/api.ts
// On Vercel: all /api/* calls go to Next.js Route Handlers in the same deployment.
// Locally:   same — no separate backend process needed when using this version.
//
// The NEXT_PUBLIC_API_URL env var is OPTIONAL.
// If set, calls go to an external Express backend (the separate-terminal setup).
// If not set, calls go to /api/* on the same Next.js server (Vercel setup).

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
// Empty string = relative URLs → uses the same Next.js server → works on Vercel

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, { cache: 'no-store', ...init })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Fixture {
  id: string; utcDate: string; competition: string
  homeTeam: string; awayTeam: string; league: string; country: string
}

export interface PredictionMarket {
  market: string; confidence: number; reason: string
}

export interface MatchPrediction {
  fixture:     Fixture
  predictions: PredictionMarket[]
  riskLevel:   string
  status:      string
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

export const fetchPredictions = () =>
  apiFetch<{ predictions: MatchPrediction[] }>('/api/predictions')

export const fetchAdminSettings = () =>
  apiFetch<{ config: any }>('/api/admin/settings')

export const updateAdminSettings = (settings: any) =>
  apiFetch<{ config: any }>('/api/admin/settings', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(settings),
  })

export const triggerFixtureRefresh = () =>
  apiFetch<{ message: string }>('/api/admin/refresh', { method: 'POST' })
