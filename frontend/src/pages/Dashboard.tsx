import { useEffect, useRef, useState } from 'react'
import { Play, Square, Target, Timer } from 'lucide-react'
import { CalibrationOverlay } from '@/components/camera/CalibrationFlow'
import { CameraView } from '@/components/camera/CameraView'
import { IssueBreakdown } from '@/components/dashboard/IssueBreakdown'
import { ScoreRing } from '@/components/dashboard/ScoreRing'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { BadgeGrid, StreakBadge } from '@/components/gamification'
import { PomodoroTimer } from '@/components/PomodoroTimer'
import { Badge, Button, Card } from '@/components/ui/primitives'
import { useToast } from '@/hooks/useToast'
import { usePostureEngine } from '@/hooks/usePostureEngine'
import { api } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { AchievementRecord, AnalyticsSummary, ISSUE_LABELS, StreakRecord } from '@/types'

export default function Dashboard() {
  const showToast = useToast()
  const sessionIdRef = useRef<number | null>(null)
  const sessionStartRef = useRef<number>(0)
  const pendingCalibrationSaveRef = useRef(false)

  const [sessionActive, setSessionActive] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [hasSavedCalibration, setHasSavedCalibration] = useState<boolean | null>(null)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [achievements, setAchievements] = useState<AchievementRecord[]>([])
  const [streak, setStreak] = useState<StreakRecord | null>(null)

  function handleSample(score: number, issues: string[]) {
    if (!sessionIdRef.current) return
    const sub = engine.state.subScores
    api
      .sampleSession(sessionIdRef.current, {
        score,
        neck_angle: sub?.neckAngle ?? 0,
        shoulder_tilt: sub?.shoulderTilt ?? 0,
        torso_lean: sub?.torsoLean ?? 0,
        issues,
      })
      .catch(() => {})
  }

  function handleSustainedBad() {
    const label = engine.state.issues.map((i) => ISSUE_LABELS[i] || i).join(', ') || 'poor posture'
    showToast(`Sustained ${label.toLowerCase()} — time for a reset.`, 'warning')
  }

  const engine = usePostureEngine(handleSample, handleSustainedBad)

  // On mount: load any previously-saved calibration so returning users don't
  // have to recalibrate every session.
  useEffect(() => {
    api
      .getActiveCalibration()
      .then((c) => {
        if (c) {
          engine.loadBaseline({
            neckAngle: c.baseline_neck_angle,
            shoulderTilt: c.baseline_shoulder_tilt,
            torsoLean: c.baseline_torso_lean,
            capturedAt: new Date(c.created_at).getTime(),
          })
          setHasSavedCalibration(true)
        } else {
          setHasSavedCalibration(false)
        }
      })
      .catch(() => setHasSavedCalibration(false))
    refreshWidgets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist a freshly-captured baseline once calibration completes — but only
  // when it came from an explicit calibration run, not from loadBaseline() above.
  useEffect(() => {
    if (!pendingCalibrationSaveRef.current || !engine.state.baseline) return
    pendingCalibrationSaveRef.current = false
    api
      .saveCalibration({
        neck_angle: engine.state.baseline.neckAngle,
        shoulder_tilt: engine.state.baseline.shoulderTilt,
        torso_lean: engine.state.baseline.torsoLean,
      })
      .then(() => {
        setHasSavedCalibration(true)
        showToast('Calibration saved — this is now your baseline.', 'success')
      })
      .catch(() => showToast('Calibration captured locally, but saving it failed.', 'warning'))
  }, [engine.state.baseline]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionActive) return
    const id = setInterval(
      () => setSessionSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000)),
      1000
    )
    return () => clearInterval(id)
  }, [sessionActive])

  function refreshWidgets() {
    api.getAnalytics('weekly').then(setSummary).catch(() => {})
    api.getAchievements().then(setAchievements).catch(() => {})
    api.getStreak().then(setStreak).catch(() => {})
  }

  async function handleStartCamera() {
    const storedSensitivity = localStorage.getItem('postura_sustain_seconds')
    const secs = storedSensitivity ? Number(storedSensitivity) : 5
    engine.setSensitivity(secs)
    await engine.startCamera()
    if (!hasSavedCalibration) {
      pendingCalibrationSaveRef.current = true
      engine.startCalibration()
    }
  }

  function handleRecalibrate() {
    pendingCalibrationSaveRef.current = true
    engine.startCalibration()
  }

  async function handleStartSession() {
    if (engine.state.isCalibrating) {
      showToast('Please wait for calibration to complete (~6 seconds).', 'warning')
      return
    }
    if (!engine.state.hasBaseline) {
      showToast('No baseline captured. Click Recalibrate to calibrate posture.', 'warning')
      return
    }
    try {
      const session = await api.startSession()
      sessionIdRef.current = session.id
      sessionStartRef.current = Date.now()
      setSessionActive(true)
      showToast('Session started.', 'success')
    } catch (err: any) {
      showToast(`Failed to start session: ${err.message || 'Error'}`, 'warning')
    }
  }

  async function handleStopSession() {
    if (!sessionIdRef.current) return
    try {
      await api.endSession(sessionIdRef.current)
      showToast('Session saved.', 'success')
    } catch (err: any) {
      showToast(`Failed to save session: ${err.message || 'Error'}`, 'warning')
    } finally {
      sessionIdRef.current = null
      setSessionActive(false)
      setSessionSeconds(0)
      refreshWidgets()
    }
  }

  const canStartSession = engine.state.ready && engine.state.hasBaseline && !engine.state.isCalibrating

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-4 relative">
          <div className="relative">
            <CameraView
              videoRef={engine.videoRef}
              canvasRef={engine.canvasRef}
              ready={engine.state.ready}
              error={engine.state.cameraError}
            />
            {engine.state.isCalibrating && (
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <CalibrationOverlay progress={engine.state.calibrationProgress} />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!engine.state.ready ? (
                <Button onClick={handleStartCamera}>
                  <span className="flex items-center gap-1.5">
                    <Play size={15} /> Start camera
                  </span>
                </Button>
              ) : !sessionActive ? (
                <Button onClick={handleStartSession}>
                  <span className="flex items-center gap-1.5">
                    <Play size={15} /> Start session
                  </span>
                </Button>
              ) : (
                <Button variant="danger" onClick={handleStopSession}>
                  <span className="flex items-center gap-1.5">
                    <Square size={15} /> Stop session
                  </span>
                </Button>
              )}
              {engine.state.ready && !engine.state.isCalibrating && !sessionActive && (
                <Button variant="secondary" size="sm" onClick={handleRecalibrate}>
                  <span className="flex items-center gap-1">
                    <Target size={14} /> Recalibrate
                  </span>
                </Button>
              )}
            </div>

            {sessionActive && (
              <div className="flex items-center gap-1.5 text-sm text-muted font-data">
                <Timer size={14} /> {formatDuration(sessionSeconds)}
              </div>
            )}
          </div>

          {engine.state.issues.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {engine.state.issues.map((issue) => (
                <Badge key={issue} tone="attention">
                  {ISSUE_LABELS[issue] || issue}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {summary && <TrendChart data={summary.trend} />}
      </div>

      <div className="space-y-6">
        <Card className="p-5 flex flex-col items-center">
          <ScoreRing score={engine.state.score} />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StreakBadge streak={streak} />
          <Card className="p-4">
            <p className="font-data text-xl font-semibold leading-none">{summary?.sessionsCount ?? 0}</p>
            <p className="text-xs text-muted mt-1.5">sessions this week</p>
          </Card>
        </div>

        <PomodoroTimer />

        {summary && <IssueBreakdown data={summary.issueBreakdown} />}
        <BadgeGrid earned={achievements} />
      </div>
    </div>
  )
}
