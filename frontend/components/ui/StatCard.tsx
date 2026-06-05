// components/ui/StatCard.tsx
interface StatCardProps {
  label:       string
  value:       string | number
  sub?:        string
  color?:      'amber' | 'ultra' | 'vsafe' | 'loss' | 'white'
  className?:  string
}

const COLORS = {
  amber: 'var(--amber)',
  ultra: 'var(--ultra)',
  vsafe: 'var(--vsafe)',
  loss:  'var(--loss)',
  white: 'rgba(255,255,255,0.90)',
}

export function StatCard({ label, value, sub, color = 'white', className = '' }: StatCardProps) {
  return (
    <div className={`card p-5 ${className}`}>
      <p className="label-lg">{label}</p>
      <p
        className="stat-number mt-2"
        style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', letterSpacing: '0.02em', color: COLORS[color] }}
      >
        {value}
      </p>
      {sub && <p className="label-sm mt-1">{sub}</p>}
    </div>
  )
}
