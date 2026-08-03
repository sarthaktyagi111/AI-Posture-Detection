import { motion } from 'framer-motion'
import { cn, scoreColor } from '@/lib/utils'

/**
 * The signature visual element: a small plumb line + bob that tilts away
 * from true vertical as the score drops, and hangs straight at 100 — a
 * literal readout of "how far off alignment you are," echoing the actual
 * measurement (angle-from-vertical) the app computes under the hood.
 */
export function ScoreRing({ score, size = 180 }: { score: number | null; size?: number }) {
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const pct = score ?? 0
  const offset = circumference - (pct / 100) * circumference
  const tilt = score === null ? 0 : ((100 - score) / 100) * 18 // degrees, 0 at perfect score

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={8}
          className="stroke-line dark:stroke-line-dark"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={score === null ? 'stroke-line dark:stroke-line-dark' : scoreColor(score).replace('text-', 'stroke-')}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        {/* plumb line */}
        <motion.div
          animate={{ rotate: tilt }}
          transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          className="absolute top-6 h-8 w-px bg-muted origin-top"
        >
          <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-plumb" />
        </motion.div>

        <span className={cn('font-data text-4xl font-semibold mt-6', scoreColor(score))}>
          {score ?? '—'}
        </span>
        <span className="text-xs text-muted uppercase tracking-wide">posture score</span>
      </div>
    </div>
  )
}
