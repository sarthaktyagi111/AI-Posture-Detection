import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/primitives'
import { ISSUE_LABELS } from '@/types'

const COLORS = ['#DD7C3F', '#3D6FE0', '#2E7D5B', '#8494A6']

export function IssueBreakdown({ data }: { data: { issue: string; percentage: number }[] }) {
  if (data.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-64 text-sm text-muted">
        No issues logged in this period — nice work.
      </Card>
    )
  }

  const chartData = data.map((d) => ({ name: ISSUE_LABELS[d.issue] || d.issue, value: d.percentage }))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium text-muted mb-2">Issue breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #D8DEE6', fontSize: 12, fontFamily: 'Manrope' }}
            formatter={(v: number) => `${v}%`}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {chartData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {d.name}
          </div>
        ))}
      </div>
    </Card>
  )
}
