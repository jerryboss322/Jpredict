'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavGroup {
  label: string
  items: { href: string; label: string; icon: React.ReactNode }[]
}

const GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
      },
      {
        href: '/today',
        label: "Today's Matches",
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/></svg>,
      },
    ],
  },
  {
    label: 'Analysis',
    items: [
      {
        href: '/predictions',
        label: 'Predictions',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 5 3-3 4 6"/></svg>,
      },
      {
        href: '/analysis',
        label: 'Match Analysis',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>,
      },
      {
        href: '/statistics',
        label: 'Statistics',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 20V10M12 20V4M6 20v-6"/></svg>,
      },
    ],
  },
  {
    label: 'Data',
    items: [
      {
        href: '/history',
        label: 'Prediction History',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5"/><path strokeLinecap="round" strokeLinejoin="round" d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>,
      },
      {
        href: '/leagues',
        label: 'Top Leagues',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M12 3c0 0-4 4-4 8a4 4 0 0 0 8 0c0-4-4-8-4-8z"/></svg>,
      },
      {
        href: '/team',
        label: 'Team Explorer',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 21v-1a7 7 0 0 1 14 0v1"/><path strokeLinecap="round" d="M22 21v-1a4 4 0 0 0-6-3.46"/></svg>,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/settings',
        label: 'Settings',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      },
      {
        href: '/admin',
        label: 'Admin Panel',
        icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      },
    ],
  },
]

function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link href={href} className={`nav-link ${active ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col bg-panel border-r"
      style={{ width: 'var(--sidebar-w)', borderColor: 'var(--border-dim)', zIndex: 40 }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border-dim)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}
          >
            <svg width="16" height="16" fill="none" stroke="#f5a623" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-8 4 5 3-3 4 6"/>
            </svg>
          </div>
          <div>
            <div className="font-display text-xl text-white tracking-wide" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
              J<span style={{ color: 'var(--amber)' }}>PREDICT</span>
            </div>
            <div className="label-sm" style={{ marginTop: '-2px' }}>Analysis Engine</div>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="label-sm px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-dim)' }}>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="label-lg">Engine Active</span>
        </div>
      </div>
    </aside>
  )
}
