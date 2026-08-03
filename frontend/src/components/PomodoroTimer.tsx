import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button, Card } from '@/components/ui/primitives'
import { fireBrowserNotification, playAlertSound } from '@/lib/posture/notifications'

const WORK_MIN = 2
const BREAK_MIN = 5

export function PomodoroTimer() {
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [secondsLeft, setSecondsLeft] = useState(WORK_MIN * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const nextMode = mode === 'work' ? 'break' : 'work'
          playAlertSound()
          fireBrowserNotification(
            nextMode === 'break' ? 'Time for a break' : 'Break over',
            nextMode === 'break' ? 'Stand up, stretch, look away from the screen.' : 'Ready for another focus block?'
          )
          setMode(nextMode)
          return (nextMode === 'work' ? WORK_MIN : BREAK_MIN) * 60
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  function reset() {
    setRunning(false)
    setMode('work')
    setSecondsLeft(WORK_MIN * 60)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted">Focus timer</h3>
        <span className="text-xs text-muted uppercase tracking-wide">{mode}</span>
      </div>
      <p className="font-data text-3xl font-semibold text-center py-2">
        {mm}:{ss}
      </p>
      <div className="flex justify-center gap-2 mt-2">
        <Button size="sm" variant="secondary" onClick={reset} aria-label="Reset timer">
          <RotateCcw size={14} />
        </Button>
        <Button size="sm" onClick={() => setRunning((r) => !r)}>
          <span className="flex items-center gap-1.5">
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? 'Pause' : 'Start'}
          </span>
        </Button>
      </div>
    </Card>
  )
}
