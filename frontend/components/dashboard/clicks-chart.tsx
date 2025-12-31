"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { TrendingUp } from "lucide-react"

interface ClicksChartProps {
  data: { date: string; clicks: number }[]
}

export function ClicksChart({ data }: ClicksChartProps) {
  const total = data.reduce((acc, d) => acc + d.clicks, 0)
  const avg = Math.round(total / data.length)

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Últimos 7 dias</h3>
          </div>
          <p className="text-3xl font-semibold text-foreground tabular-nums">{total.toLocaleString("pt-BR")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Média de <span className="text-foreground font-medium">{avg.toLocaleString("pt-BR")}</span> por dia
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+12%</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                <stop offset="50%" stopColor="#6366F1" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(250, 250, 250, 0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 11 }}
              tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 10, 11, 0.95)",
                border: "1px solid rgba(250, 250, 250, 0.08)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                padding: "12px 16px",
              }}
              labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: "4px" }}
              itemStyle={{ color: "#6366F1", fontSize: "14px" }}
              formatter={(value: number) => [value.toLocaleString("pt-BR"), "Cliques"]}
              cursor={{ stroke: "rgba(99, 102, 241, 0.3)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#clicksGradient)"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
