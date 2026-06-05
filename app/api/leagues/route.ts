// app/api/leagues/route.ts
import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'

const LEAGUE_META: Record<string, { name: string; country: string }> = {
  PL:  { name: 'Premier League',   country: 'England'     },
  PD:  { name: 'La Liga',          country: 'Spain'       },
  BL1: { name: 'Bundesliga',       country: 'Germany'     },
  SA:  { name: 'Serie A',          country: 'Italy'       },
  FL1: { name: 'Ligue 1',          country: 'France'      },
  CL:  { name: 'Champions League', country: 'Europe'      },
  DED: { name: 'Eredivisie',       country: 'Netherlands' },
  PPL: { name: 'Primeira Liga',    country: 'Portugal'    },
  ELC: { name: 'Championship',     country: 'England'     },
}

export async function GET() {
  const { activeLeagues } = getConfig()
  return NextResponse.json({
    leagues: activeLeagues.map(code => ({ code, ...LEAGUE_META[code] })),
  })
}
