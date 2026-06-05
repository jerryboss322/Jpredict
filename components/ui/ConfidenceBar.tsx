// components/ui/ConfidenceBar.tsx
interface ConfidenceBarProps {
  label:      string
  value:      number   // 0–100
  color?:     string
  showValue?: boolean
}

export function ConfidenceBar({ label, value, color, showValue = true }: ConfidenceBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  const barColor = color ?? (
    pct >= 90 ? 'var(--ultra)'
    : pct >= 80 ? 'var(--vsafe)'
    : pct >= 70 ? 'var(--mod)'
    : 'var(--low)'
  )
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="label-lg">{label}</span>
        {showValue && (
          <span className="font-mono text-xs font-bold" style={{ color: barColor }}>
            {pct.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="conf-track">
        <div className="conf-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  )
}
