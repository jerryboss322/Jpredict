// lib/config.ts
// Reads all config from environment variables.

export interface EngineConfig {
  apiKey:            string   // football-data.org
  apiFootballKey:    string   // api-football (api-sports.io)
  oddsApiKey:        string   // odds-api.io (all-leagues fixture source + odds)
  minConfidence:     number
  activeLeagues:     string[]
  maxPredictions:    number
}

const DEFAULT_LEAGUES = 'PL,PD,BL1,SA,FL1,DED,PPL,ELC,BSA,CL,EL,EC,NL,WC'

export function getConfig(): EngineConfig {
  return {
    apiKey:           process.env.FOOTBALL_DATA_API_KEY ?? '',
    apiFootballKey:   process.env.API_FOOTBALL_KEY      ?? '',
    oddsApiKey:       process.env.ODDS_API_KEY          ?? '',
    minConfidence:    parseInt(process.env.MIN_CONFIDENCE  ?? '80', 10),
    maxPredictions:   parseInt(process.env.MAX_PREDICTIONS ?? '3',  10),
    activeLeagues:    (process.env.ACTIVE_LEAGUES ?? DEFAULT_LEAGUES)
                        .split(',').map(s => s.trim()).filter(Boolean),
  }
}
