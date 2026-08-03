import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/primitives'

export function TrendChart({ data }: { data: { date: string; avgScore: number }[] }) {
  if (data.length === 0) {
    return (
      <Card className="p-6 flex items-center justify-center h-64 text-sm text-muted">
        No sessions in this period yet — start one from the dashboard.
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-medium text-muted mb-4">Score trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 11, fill: '#5C6B7A' }}
            axisLine={{ stroke: '#D8DEE6' }}
            tickLine={false}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5C6B7A' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #D8DEE6', fontSize: 12, fontFamily: 'Manrope' }}
            labelFormatter={(d) => new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke="#3D6FE0"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#3D6FE0' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
