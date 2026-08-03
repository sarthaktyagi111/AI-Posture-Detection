import { useEffect, useState } from 'react'
import { IssueBreakdown } from '@/components/dashboard/IssueBreakdown'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { Card, Skeleton } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { AnalyticsSummary, ISSUE_LABELS } from '@/types'

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

export default function Analytics() {
  const [period, setPeriod] = useState('weekly')
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    setSummary(null)
    api.getAnalytics(period).then(setSummary).catch(() => setSummary(null))
  }, [period])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex rounded-md border border-line dark:border-line-dark p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-sm font-medium transition-colors',
                period === p.key ? 'bg-ink text-paper dark:bg-plumb dark:text-white' : 'text-muted'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!summary ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="font-data text-2xl font-semibold">{summary.sessionsCount}</p>
              <p className="text-xs text-muted mt-1">sessions</p>
            </Card>
            <Card className="p-4">
              <p className="font-data text-2xl font-semibold">
                {summary.bestDay ? new Date(summary.bestDay).toLocaleDateString([], { weekday: 'short' }) : '—'}
              </p>
              <p className="text-xs text-muted mt-1">best day</p>
            </Card>
            <Card className="p-4">
              <p className="text-lg font-semibold leading-tight">
                {summary.topIssue ? ISSUE_LABELS[summary.topIssue] || summary.topIssue : 'None logged'}
              </p>
              <p className="text-xs text-muted mt-1">top issue</p>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TrendChart data={summary.trend} />
            <IssueBreakdown data={summary.issueBreakdown} />
          </div>
        </>
      )}
    </div>
  )
}
