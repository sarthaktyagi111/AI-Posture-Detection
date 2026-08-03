export interface SessionRecord {
  id: number
  user_id: number
  start_time: string
  end_time: string | null
  avg_score: number | null
  duration_seconds: number | null
}

export interface AnalyticsSummary {
  trend: { date: string; avgScore: number }[]
  issueBreakdown: { issue: string; percentage: number }[]
  sessionsCount: number
  bestDay: string | null
  topIssue: string | null
}

export interface AchievementRecord {
  id: number
  badge_type: string
  earned_at: string
}

export interface StreakRecord {
  current_streak_days: number
  longest_streak_days: number
  last_active_date: string | null
}

export interface GoalRecord {
  id: number
  target_avg_score: number
  period: string
  start_date: string
  end_date: string
  achieved: boolean
}

export const ISSUE_LABELS: Record<string, string> = {
  forward_head: 'Forward head posture',
  shoulder_imbalance: 'Shoulder imbalance',
  slouching_or_leaning: 'Slouching / leaning',
}

export const BADGE_INFO: Record<string, { label: string; description: string; emoji: string }> = {
  first_session: { label: 'First Session', description: 'Completed your first tracked session', emoji: '🌱' },
  perfect_session: { label: 'Perfect Form', description: 'Averaged 90+ in a single session', emoji: '🎯' },
  week_streak: { label: 'Week Streak', description: '7 days active in a row', emoji: '🔥' },
  consistency_king: { label: 'Consistency', description: '5+ sessions in one week', emoji: '📈' },
  century_club: { label: 'Century Club', description: '100 sessions tracked', emoji: '💯' },
}
