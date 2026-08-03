import { useCallback, useEffect, useRef, useState } from 'react'
import { Baseline, CalibrationSession } from '@/lib/posture/calibration'
import { getPoseLandmarker } from '@/lib/posture/landmarks'
import { classifyIssues, computeRawMetrics, Point3D } from '@/lib/posture/metrics'
import {
  fireBrowserNotification,
  playAlertSound,
  requestNotificationPermission,
  SustainedPostureTracker,
} from '@/lib/posture/notifications'
import { scoreFrame, smooth } from '@/lib/posture/scoring'

export interface PostureState {
  ready: boolean
  isCalibrating: boolean
  calibrationProgress: number
  hasBaseline: boolean
  baseline: Baseline | null
  score: number | null
  subScores: Record<string, number> | null
  issues: string[]
  cameraError: string | null
}

const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [0, 11], [0, 12],
]

const initialState: PostureState = {
  ready: false,
  isCalibrating: false,
  calibrationProgress: 0,
  hasBaseline: false,
  baseline: null,
  score: null,
  subScores: null,
  issues: [],
  cameraError: null,
}

export function usePostureEngine(
  onSample?: (score: number, issues: string[]) => void,
  onSustainedBad?: (type: 'severe' | 'strain') => void,
  sustainSeconds = 5
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sideVideoRef = useRef<HTMLVideoElement>(null)
  const sideCanvasRef = useRef<HTMLCanvasElement>(null)

  const calibrationRef = useRef(new CalibrationSession())
  const trackerRef = useRef(new DualPostureTracker(sustainSeconds, 70))
  const baselineRef = useRef<Baseline | null>(null)
  const smoothedRef = useRef<number | null>(null)
  const rafRef = useRef<number>()
  const lastSampleRef = useRef(0)
  const runningRef = useRef(false)
  const sideRunningRef = useRef(false)
  const isCalibratingRef = useRef(false)
  const callbacksRef = useRef({ onSample, onSustainedBad })
  callbacksRef.current = { onSample, onSustainedBad }

  const [state, setState] = useState<PostureState>(initialState)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [sideCameraActive, setSideCameraActive] = useState(false)

  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoDevices)
    } catch {}
  }, [])

  const loop = useCallback(async () => {
    if (!runningRef.current || !videoRef.current) return
    const landmarker = await getPoseLandmarker()
    if (!runningRef.current) return

    const now = performance.now()
    const result = landmarker.detectForVideo(videoRef.current, now)
    const landmarks = result.landmarks?.[0] as Point3D[] | undefined

    drawOverlay(canvasRef.current, videoRef.current, landmarks)

    // Side camera detection if active
    let sideLandmarks: Point3D[] | undefined
    if (sideRunningRef.current && sideVideoRef.current) {
      try {
        const sideResult = landmarker.detectForVideo(sideVideoRef.current, now)
        sideLandmarks = sideResult.landmarks?.[0] as Point3D[] | undefined
        drawOverlay(sideCanvasRef.current, sideVideoRef.current, sideLandmarks)
      } catch {}
    }

    if (landmarks) {
      if (isCalibratingRef.current) {
        calibrationRef.current.addFrame(landmarks)
        const progress = calibrationRef.current.progress(now)
        if (calibrationRef.current.isComplete(now)) {
          const baseline = calibrationRef.current.finalize()
          baselineRef.current = baseline
          isCalibratingRef.current = false
          setState((s) => ({ ...s, isCalibrating: false, calibrationProgress: 1, hasBaseline: !!baseline, baseline }))
        } else {
          setState((s) => ({ ...s, calibrationProgress: progress }))
        }
      } else if (baselineRef.current) {
        const raw = computeRawMetrics(landmarks)
        if (raw) {
          const { composite, subScores } = scoreFrame(raw, baselineRef.current)
          smoothedRef.current = smooth(smoothedRef.current, composite)
          const smoothedScore = Math.round(smoothedRef.current)
          const issues = classifyIssues(raw, baselineRef.current)

          setState((s) => ({ ...s, score: smoothedScore, subScores, issues }))

          // Two types of notifications evaluated by DualPostureTracker
          const { notificationType } = trackerRef.current.check(smoothedScore, issues, now)
          if (notificationType === 'severe') {
            fireBrowserNotification(
              '🚨 Severe Bad Posture Alert!',
              `Your posture score dropped to ${smoothedScore} (below 70) for 5 seconds. Sit up straight!`
            )
            playAlertSound()
            callbacksRef.current.onSustainedBad?.('severe')
          } else if (notificationType === 'strain') {
            const formattedIssues = issues.map((i) => i.replace('_', ' ')).join(', ') || 'muscle strain'
            fireBrowserNotification(
              '⚠️ Posture Warning — Joint/Neck Strain!',
              `Posture score is ${smoothedScore}, but ${formattedIssues} detected for 5 seconds. Adjust your alignment.`
            )
            playAlertSound()
            callbacksRef.current.onSustainedBad?.('strain')
          }

          if (now - lastSampleRef.current > 5000) {
            lastSampleRef.current = now
            callbacksRef.current.onSample?.(smoothedScore, issues)
          }
        }
      }
    }

    if (runningRef.current) rafRef.current = requestAnimationFrame(loop)
  }, [])

  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { width: 640, height: 480, facingMode: 'user' },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      await getPoseLandmarker()
      await requestNotificationPermission()
      await refreshDevices()
      runningRef.current = true
      setState((s) => ({ ...s, ready: true, cameraError: null }))
      loop()
    } catch {
      setState((s) => ({ ...s, cameraError: 'Camera access was denied or is unavailable.' }))
    }
  }, [loop, refreshDevices])

  const startSideCamera = useCallback(async (deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      })
      if (sideVideoRef.current) {
        sideVideoRef.current.srcObject = stream
        await sideVideoRef.current.play()
      }
      sideRunningRef.current = true
      setSideCameraActive(true)
    } catch {
      console.warn('Failed to start secondary side camera.')
    }
  }, [])
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      await getPoseLandmarker()
      await requestNotificationPermission()
      runningRef.current = true
      setState((s) => ({ ...s, ready: true, cameraError: null }))
      loop()
    } catch {
      setState((s) => ({ ...s, cameraError: 'Camera access was denied or is unavailable.' }))
    }
  }, [loop])

  const stopCamera = useCallback(() => {
    runningRef.current = false
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const stream = videoRef.current?.srcObject as MediaStream | undefined
    stream?.getTracks().forEach((t) => t.stop())
    setState((s) => ({ ...s, ready: false }))
  }, [])

  const startCalibration = useCallback(() => {
    isCalibratingRef.current = true
    calibrationRef.current.start(performance.now())
    setState((s) => ({ ...s, isCalibrating: true, calibrationProgress: 0, hasBaseline: false }))
  }, [])

  const setSensitivity = useCallback((seconds: number) => {
    trackerRef.current.setSustainSeconds(seconds)
  }, [])

  /** Seeds the engine with a baseline fetched from the backend, skipping a fresh calibration. */
  const loadBaseline = useCallback((baseline: Baseline) => {
    baselineRef.current = baseline
    setState((s) => ({ ...s, hasBaseline: true, baseline }))
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  return { videoRef, canvasRef, state, startCamera, stopCamera, startCalibration, setSensitivity, loadBaseline }
}

function drawOverlay(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: Point3D[] | undefined
) {
  if (!canvas || !video.videoWidth) return
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!landmarks) return

  ctx.strokeStyle = '#3D6FE0'
  ctx.lineWidth = 3
  SKELETON_CONNECTIONS.forEach(([a, b]) => {
    const pa = landmarks[a]
    const pb = landmarks[b]
    if (!pa || !pb) return
    ctx.beginPath()
    ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height)
    ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height)
    ctx.stroke()
  })

  ctx.fillStyle = '#7DA0F0'
  landmarks.forEach((p) => {
    ctx.beginPath()
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
}
