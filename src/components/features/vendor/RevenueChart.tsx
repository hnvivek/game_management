'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const revenueData = [
  { name: 'Mon', revenue: 2800, bookings: 12 },
  { name: 'Tue', revenue: 3200, bookings: 15 },
  { name: 'Wed', revenue: 2100, bookings: 8 },
  { name: 'Thu', revenue: 3600, bookings: 18 },
  { name: 'Fri', revenue: 4200, bookings: 22 },
  { name: 'Sat', revenue: 5800, bookings: 28 },
  { name: 'Sun', revenue: 5100, bookings: 25 }
]

const monthlyData = [
  { name: 'Jan', revenue: 28000, bookings: 186 },
  { name: 'Feb', revenue: 32000, bookings: 212 },
  { name: 'Mar', revenue: 35000, bookings: 235 },
  { name: 'Apr', revenue: 31000, bookings: 198 },
  { name: 'May', revenue: 38000, bookings: 245 },
  { name: 'Jun', revenue: 42000, bookings: 278 }
]

export function RevenueChart() {
  return (
    <div className="space-y-6">
      {/* Daily Revenue */}
      <div>
        <h3 className="text-sm font-medium mb-4">Daily Revenue (This Week)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: any, name: string) => [
                name === 'revenue' ? `$${value}` : value,
                name === 'revenue' ? 'Revenue' : 'Bookings'
              ]}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Trend */}
      <div>
        <h3 className="text-sm font-medium mb-4">Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <div className="text-2xl font-bold">$26,800</div>
          <div className="text-sm text-muted-foreground">This Week</div>
          <div className="text-xs text-green-500">+12.5% from last week</div>
        </div>
        <div>
          <div className="text-2xl font-bold">$42,000</div>
          <div className="text-sm text-muted-foreground">This Month</div>
          <div className="text-xs text-green-500">+15.2% from last month</div>
        </div>
      </div>
    </div>
  )
}