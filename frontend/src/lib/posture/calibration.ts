import { computeRawMetrics, Point3D, RawMetrics } from './metrics'

export interface Baseline extends RawMetrics {
  capturedAt: number
}

const CALIBRATION_DURATION_MS = 6000
const MIN_SAMPLES = 10

/**
 * Captures a short window of "good posture" frames and averages them into
 * a personal baseline. Instantiate one per calibration attempt (store in a
 * ref inside React so it survives re-renders without re-creating state).
 */
export class CalibrationSession {
  private samples: RawMetrics[] = []
  private startedAt: number | null = null

  start(now: number) {
    this.samples = []
    this.startedAt = now
  }

  addFrame(landmarks: Point3D[]) {
    if (this.startedAt === null) return
    const raw = computeRawMetrics(landmarks)
    if (raw) this.samples.push(raw)
  }

  progress(now: number): number {
    if (this.startedAt === null) return 0
    return Math.min(1, (now - this.startedAt) / CALIBRATION_DURATION_MS)
  }

  isComplete(now: number): boolean {
    return this.progress(now) >= 1
  }

  /** Returns null if too few valid frames were captured (e.g. person left frame). */
  finalize(): Baseline | null {
    if (this.samples.length < MIN_SAMPLES) return null
    const avg = (key: keyof RawMetrics) =>
      this.samples.reduce((sum, s) => sum + s[key], 0) / this.samples.length
    return {
      neckAngle: avg('neckAngle'),
      shoulderTilt: avg('shoulderTilt'),
      torsoLean: avg('torsoLean'),
      capturedAt: Date.now(),
    }
  }
}
