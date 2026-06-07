// lib/config.ts
// Reads all config from environment variables.
// Set these in Vercel → Project → Settings → Environment Variables

export interface EngineConfig {
  apiKey:         string
  minConfidence:  number
  activeLeagues:  string[]
  maxPredictions: number
}

// All competitions available on football-data.org free tier
// World Cup (WC) and Nations League (NL) only return data during active tournaments
const DEFAULT_LEAGUES = 'PL,PD,BL1,SA,FL1,DED,PPL,ELC,CL,EL,EC,NL,WC'

export function getConfig(): EngineConfig {
  return {
    apiKey:         process.env.FOOTBALL_DATA_API_KEY ?? '',
    minConfidence:  parseInt(process.env.MIN_CONFIDENCE  ?? '80', 10),
    maxPredictions: parseInt(process.env.MAX_PREDICTIONS ?? '3',  10),
    activeLeagues:  (process.env.ACTIVE_LEAGUES ?? DEFAULT_LEAGUES)
                      .split(',').map(s => s.trim()).filter(Boolean),
  }
}
