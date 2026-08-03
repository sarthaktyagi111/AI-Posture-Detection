import { RawMetrics } from './metrics'

// Tunable constants. Sensitivity controls how many "points" are lost per
// degree of deviation from baseline — raise it if the scorer feels too
// forgiving, lower it if minor natural movement tanks the score too easily.
const WEIGHTS: Record<keyof RawMetrics, number> = {
  neckAngle: 0.4,
  shoulderTilt: 0.25,
  torsoLean: 0.35,
}

const SENSITIVITY: Record<keyof RawMetrics, number> = {
  neckAngle: 2.5,
  shoulderTilt: 3,
  torsoLean: 2.5,
}

export interface ScoreResult {
  composite: number
  subScores: Record<keyof RawMetrics, number>
}

export function scoreFrame(raw: RawMetrics, baseline: RawMetrics): ScoreResult {
  const subScores = {} as Record<keyof RawMetrics, number>
  let composite = 0
  ;(Object.keys(WEIGHTS) as (keyof RawMetrics)[]).forEach((key) => {
    const deviation = Math.abs(raw[key] - baseline[key])
    const sub = Math.max(0, 100 - deviation * SENSITIVITY[key])
    subScores[key] = sub
    composite += sub * WEIGHTS[key]
  })
  return { composite: Math.round(composite), subScores }
}

/** Exponential moving average — kills frame-to-frame jitter from landmark noise. */
export function smooth(prev: number | null, next: number, alpha = 0.15): number {
  return prev === null ? next : alpha * next + (1 - alpha) * prev
}
