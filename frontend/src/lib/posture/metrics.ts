export interface Point3D {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface RawMetrics {
  neckAngle: number // degrees off vertical, ear-midpoint vs shoulder-midpoint
  shoulderTilt: number // degrees off horizontal, left vs right shoulder
  torsoLean: number // degrees off vertical, shoulder-midpoint vs hip-midpoint
}

// Standard MediaPipe Pose 33-point landmark indices we use.
export const LM = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const

function midpoint(a: Point3D, b: Point3D) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function angleFromVertical(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return (Math.atan2(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * 180) / Math.PI
}

function angleFromHorizontal(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (Math.atan2(Math.abs(b.y - a.y), Math.abs(b.x - a.x)) * 180) / Math.PI
}

/**
 * Computes posture metrics from a single frame's landmarks.
 *
 * Honest limitation: neckAngle here is a 2D front-camera proxy. Forward-head
 * posture is really a depth change toward the screen, which a single frontal
 * camera can't observe directly. Two ways to strengthen it if you want to go
 * further: (1) use MediaPipe's `worldLandmarks` z-component for a rough
 * single-camera depth estimate, or (2) add the optional side-view companion
 * camera for a direct 2D measurement with no depth estimation involved.
 */
export function computeRawMetrics(landmarks: Point3D[]): RawMetrics | null {
  const ls = landmarks[LM.LEFT_SHOULDER]
  const rs = landmarks[LM.RIGHT_SHOULDER]
  const le = landmarks[LM.LEFT_EAR]
  const re = landmarks[LM.RIGHT_EAR]
  if (!ls || !rs || !le || !re) return null

  // Require shoulders and ears to be visible (>0.3 visibility)
  const visibilityOk = [ls, rs, le, re].every((p) => (p.visibility ?? 1) > 0.3)
  if (!visibilityOk) return null

  const shoulderMid = midpoint(ls, rs)
  const earMid = midpoint(le, re)

  // Hips are often cropped out of desktop webcams. If present and visible, use them;
  // otherwise fallback to a vertical proxy below shoulder midpoint.
  const lh = landmarks[LM.LEFT_HIP]
  const rh = landmarks[LM.RIGHT_HIP]
  const hipsVisible = lh && rh && (lh.visibility ?? 1) > 0.3 && (rh.visibility ?? 1) > 0.3
  const hipMid = hipsVisible ? midpoint(lh, rh) : { x: shoulderMid.x, y: shoulderMid.y + 0.3 }

  return {
    neckAngle: angleFromVertical(shoulderMid, earMid),
    shoulderTilt: angleFromHorizontal(ls, rs),
    torsoLean: angleFromVertical(hipMid, shoulderMid),
  }
}

export function classifyIssues(
  raw: RawMetrics,
  baseline: RawMetrics,
  sensitivity: { neck: number; shoulder: number; torso: number } = { neck: 8, shoulder: 6, torso: 7 }
): string[] {
  const issues: string[] = []
  if (raw.neckAngle - baseline.neckAngle > sensitivity.neck) issues.push('forward_head')
  if (raw.shoulderTilt - baseline.shoulderTilt > sensitivity.shoulder) issues.push('shoulder_imbalance')
  if (raw.torsoLean - baseline.torsoLean > sensitivity.torso) issues.push('slouching_or_leaning')
  return issues
}
