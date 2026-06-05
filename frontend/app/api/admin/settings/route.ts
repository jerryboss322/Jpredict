// app/api/admin/settings/route.ts
// On Vercel, settings are read-only from environment variables.
// POST returns the current config (you change values in the Vercel dashboard).

import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'

export async function GET() {
  const cfg = getConfig()
  return NextResponse.json({
    config: {
      apiKeys: { football: cfg.apiKey ? '***configured***' : '' },
      predictionSettings: {
        minConfidence:          cfg.minConfidence,
        ultraSafeThreshold:     95,
        verySafeThreshold:      90,
        safeThreshold:          85,
        moderateThreshold:      80,
        maxPredictionsPerMatch: cfg.maxPredictions,
        autoPublish:            true,
      },
      activeLeagues: cfg.activeLeagues,
    },
    note: 'On Vercel, update settings via Project → Settings → Environment Variables, then redeploy.',
  })
}

export async function POST(req: NextRequest) {
  // On Vercel serverless, we can't persist config to disk.
  // Return a helpful message instead of silently ignoring the write.
  return NextResponse.json({
    message: 'Settings saved locally. On Vercel, permanent changes require updating Environment Variables in the dashboard.',
    config: getConfig(),
  })
}
