// lib/config.ts
// On Vercel: all config comes from Environment Variables set in the dashboard.
// Locally:   values come from .env.local
// No file system writes needed — Vercel is stateless.

export interface EngineConfig {
  apiKey:         string
  minConfidence:  number
  activeLeagues:  string[]
  maxPredictions: number
}

export function getConfig(): EngineConfig {
  return {
    apiKey:         process.env.FOOTBALL_DATA_API_KEY ?? '',
    minConfidence:  parseInt(process.env.MIN_CONFIDENCE  ?? '80', 10),
    maxPredictions: parseInt(process.env.MAX_PREDICTIONS ?? '3',  10),
    activeLeagues:  (process.env.ACTIVE_LEAGUES ?? 'PL,PD,BL1,SA,FL1').split(',').map(s => s.trim()),
  }
}
