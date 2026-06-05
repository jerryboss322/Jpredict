'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/':            { title: 'Dashboard',          sub: 'Intelligence Overview'         },
  '/today':       { title: "Today's Matches",     sub: 'Live Fixture Feed'             },
  '/predictions': { title: 'Predictions',         sub: 'Top-3 Ranked Picks Per Match'  },
  '/analysis':    { title: 'Match Analysis',      sub: 'Full Statistical Breakdown'    },
  '/statistics':  { title: 'Statistics',          sub: 'League & Accuracy Metrics'     },
  '/history':     { title: 'Prediction History',  sub: 'Historical Record'             },
  '/leagues':     { title: 'Top Leagues',         sub: 'League Intelligence'           },
  '/team':        { title: 'Team Explorer',       sub: 'Club Form & Trends'            },
  '/settings':    { title: 'Settings',            sub: 'Engine Configuration'          },
  '/admin':       { title: 'Admin Panel',         sub: 'System Management'             },
}

export function TopBar() {
  const pathname = usePathname()
  const base = '/' + pathname.split('/')[1]
  const meta = PAGE_TITLES[base] ?? PAGE_TITLES['/']

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
      style={{ background: 'rgba(8,14,20,0.92)', backdropFilter: 'blur(12px)', borderColor: 'var(--border-dim)', height: '56px' }}
    >
      {/* Page identity */}
      <div className="flex items-center gap-3">
        <div>
          <h1
            className="text-white font-semibold leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.06em' }}
          >
            {meta.title}
          </h1>
          <p className="label-sm mt-0.5">{meta.sub}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5">
          <span className="live-dot" />
          <span className="label-lg text-ultra" style={{ color: 'var(--ultra)' }}>LIVE</span>
        </div>
        <span className="hidden sm:block label-lg">{today}</span>
        <a
          href="/admin"
          className="btn-ghost text-xs py-1.5 px-3"
          style={{ fontSize: '0.65rem' }}
        >
          Admin
        </a>
      </div>
    </header>
  )
}
