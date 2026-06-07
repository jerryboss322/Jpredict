'use client'
// app/admin/login/page.tsx
// Standalone password gate for the admin panel.
// Password is set via ADMIN_PASSWORD env var (default: "jpredict-admin").

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router                  = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })

      if (res.ok) {
        // Store session token in sessionStorage (cleared on tab close)
        const { token } = await res.json()
        sessionStorage.setItem('admin_token', token)
        router.push('/admin')
      } else {
        setError('Incorrect password.')
      }
    } catch {
      setError('Authentication failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="card w-full max-w-sm p-8 space-y-6"
        style={{ border: '1px solid var(--border-dim)' }}
      >
        {/* Header */}
        <div className="space-y-1 text-center">
          <h1
            className="font-display text-white"
            style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.06em' }}
          >
            ADMIN ACCESS
          </h1>
          <p className="label-sm">JPredict Control Panel</p>
        </div>

        {/* Lock icon */}
        <div className="flex justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="label-sm block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              className="w-full px-4 py-3 rounded text-white text-sm outline-none transition-all"
              style={{
                background:  'var(--bg-raised)',
                border:      `1px solid ${error ? 'var(--low)' : 'var(--border-dim)'}`,
                fontFamily:  'var(--font-mono)',
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: 'var(--low)', fontFamily: 'var(--font-mono)' }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded font-semibold text-sm transition-all"
            style={{
              background: loading ? 'rgba(245,166,35,0.4)' : 'var(--amber)',
              color:      'var(--bg-base)',
              cursor:     loading || !password ? 'not-allowed' : 'pointer',
              opacity:    !password ? 0.6 : 1,
            }}
          >
            {loading ? 'Verifying...' : 'Enter Admin Panel'}
          </button>
        </form>

        <p className="text-center" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>
          Restricted access. Authorised personnel only.
        </p>
      </div>
    </div>
  )
}
