import { Flame } from 'lucide-react'
import { Card } from '@/components/ui/primitives'
import { AchievementRecord, BADGE_INFO, StreakRecord } from '@/types'

export function StreakBadge({ streak }: { streak: StreakRecord | null }) {
  const days = streak?.current_streak_days ?? 0
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-attention-soft dark:bg-attention/20">
        <Flame size={18} className="text-attention" />
      </div>
      <div>
        <p className="font-data text-xl font-semibold leading-none">{days}</p>
        <p className="text-xs text-muted mt-0.5">day streak</p>
      </div>
    </Card>
  )
}

export function BadgeGrid({ earned }: { earned: AchievementRecord[] }) {
  const earnedTypes = new Set(earned.map((a) => a.badge_type))
  const allBadges = Object.entries(BADGE_INFO)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium text-muted mb-4">Achievements</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {allBadges.map(([key, info]) => {
          const isEarned = earnedTypes.has(key)
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-center transition-opacity ${
                isEarned
                  ? 'border-line dark:border-line-dark opacity-100'
                  : 'border-line/50 dark:border-line-dark/50 opacity-35 grayscale'
              }`}
              title={info.description}
            >
              <span className="text-2xl">{info.emoji}</span>
              <span className="text-xs font-medium leading-tight">{info.label}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
