// components/predictions/PredictionCard.tsx
// Displays a single ranked prediction pick.

interface PredictionCardProps {
  rank:       number
  market:     string
  confidence: number
  reason:     string
  isTop?:     boolean
}

const SAFETY = (c: number) =>
  c >= 95 ? { label: 'Ultra Safe', cls: 'badge-ultra', barColor: 'var(--ultra)'  } :
  c >= 90 ? { label: 'Very Safe',  cls: 'badge-vsafe', barColor: 'var(--vsafe)'  } :
  c >= 85 ? { label: 'Safe',       cls: 'badge-safe',  barColor: 'var(--safe)'   } :
  c >= 80 ? { label: 'Moderate',   cls: 'badge-mod',   barColor: 'var(--mod)'    } :
            { label: 'Discard',    cls: 'badge-low',   barColor: 'var(--low)'    }

const RANK_CLR = ['var(--amber)', 'var(--ultra)', 'rgba(255,255,255,0.50)']

export function PredictionCard({ rank, market, confidence, reason, isTop }: PredictionCardProps) {
  const safety = SAFETY(confidence)
  const rankColor = RANK_CLR[rank - 1] ?? RANK_CLR[2]

  return (
    <article
      className="card p-4 space-y-3 anim-fade"
      style={isTop ? { borderColor: 'rgba(245,166,35,0.22)', background: 'rgba(245,166,35,0.04)' } : {}}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Rank numeral */}
          <span
            className="font-display text-2xl leading-none shrink-0"
            style={{ fontFamily: 'var(--font-display)', color: rankColor, fontSize: '1.6rem' }}
          >
            #{rank}
          </span>
          {/* Market name */}
          <span className="font-semibold text-white/90 text-sm leading-snug">{market}</span>
        </div>

        {/* Confidence + safety badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="font-display leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: rankColor }}
          >
            {Math.round(confidence)}%
          </span>
          <span className={`pill ${safety.cls}`} style={{ fontSize: '0.58rem' }}>
            {safety.label}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="conf-track">
        <div
          className="conf-fill"
          style={{ width: `${confidence}%`, background: safety.barColor }}
        />
      </div>

      {/* Reasoning */}
      <p className="md-body text-xs leading-relaxed" style={{ fontSize: '0.78rem' }}>{reason}</p>
    </article>
  )
}
