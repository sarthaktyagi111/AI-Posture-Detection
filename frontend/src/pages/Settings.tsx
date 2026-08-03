import { useEffect, useState } from 'react'
import { Button, Card } from '@/components/ui/primitives'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import { GoalRecord } from '@/types'

export default function Settings() {
  const { user } = useAuth()
  const showToast = useToast()
  const [target, setTarget] = useState(80)
  const [goals, setGoals] = useState<GoalRecord[]>([])
  const [sustainSeconds, setSustainSeconds] = useState(5)

  useEffect(() => {
    api.getGoals().then(setGoals).catch(() => {})
    const stored = localStorage.getItem('postura_sustain_seconds')
    if (stored) setSustainSeconds(Number(stored))
    else setSustainSeconds(5)
  }, [])

  async function saveGoal() {
    const goal = await api.setGoal(target, 'weekly')
    setGoals((g) => [goal, ...g])
    showToast('Weekly goal set.', 'success')
  }

  function saveSensitivity(value: number) {
    setSustainSeconds(value)
    localStorage.setItem('postura_sustain_seconds', String(value))
    showToast('Notification sensitivity updated for future sessions.', 'success')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-medium text-muted">Account</h2>
        <p className="text-sm">
          Signed in as <span className="font-medium">{user?.username}</span> ({user?.email})
        </p>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-muted">Weekly score goal</h2>
          <p className="text-xs text-muted mt-1">Set a target average score to aim for this week.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={50}
            max={100}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="flex-1 accent-plumb"
          />
          <span className="font-data w-10 text-right">{target}</span>
        </div>
        <Button size="sm" onClick={saveGoal}>
          Set weekly goal
        </Button>
        {goals.length > 0 && (
          <p className="text-xs text-muted">
            Current goal: {goals[0].target_avg_score} avg score ({goals[0].period})
          </p>
        )}
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-muted">Notification sensitivity</h2>
          <p className="text-xs text-muted mt-1">
            How long poor posture must persist before you get a notification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={60}
            step={1}
            value={sustainSeconds}
            onChange={(e) => saveSensitivity(Number(e.target.value))}
            className="flex-1 accent-plumb"
          />
          <span className="font-data w-14 text-right">{sustainSeconds}s</span>
        </div>
        <p className="text-xs text-muted">
          Applied the next time you start the camera. (Recalibrate from the dashboard any time your setup changes.)
        </p>
      </Card>
    </div>
  )
}
