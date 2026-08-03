import { Download, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Skeleton } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { formatDate, formatDuration, formatTime, scoreColor } from '@/lib/utils'
import { SessionRecord } from '@/types'

export default function History() {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null)

  useEffect(() => {
    api.getSessions().then(setSessions).catch(() => setSessions([]))
  }, [])

  function exportCsv() {
    if (!sessions) return
    const rows = [
      ['Date', 'Start', 'End', 'Duration (min)', 'Avg Score'],
      ...sessions.map((s) => [
        formatDate(s.start_time),
        s.start_time,
        s.end_time ?? '',
        s.duration_seconds ? Math.round(s.duration_seconds / 60).toString() : '',
        s.avg_score?.toFixed(1) ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `postura-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold">Session history</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!sessions?.length}>
            <span className="flex items-center gap-1.5">
              <Download size={14} /> Export CSV
            </span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <span className="flex items-center gap-1.5">
              <Printer size={14} /> Print / Save PDF
            </span>
          </Button>
        </div>
      </div>

      {!sessions ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          No sessions yet — start one from the dashboard and it'll show up here.
        </Card>
      ) : (
        <Card className="divide-y divide-line dark:divide-line-dark overflow-hidden">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium">{formatDate(s.start_time)}</p>
                <p className="text-xs text-muted">
                  {formatTime(s.start_time)}
                  {s.end_time ? ` – ${formatTime(s.end_time)}` : ' (in progress)'} ·{' '}
                  {formatDuration(s.duration_seconds)}
                </p>
              </div>
              <span className={`font-data text-lg font-semibold ${scoreColor(s.avg_score)}`}>
                {s.avg_score ? Math.round(s.avg_score) : '—'}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
