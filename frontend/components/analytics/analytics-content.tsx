"use client"

import { useState, useEffect } from "react"
import { api, type Link, type DashboardStats, type AnalyticsStats } from "@/lib/api"
import { MetricCard } from "@/components/ui/metric-card"
import { CountryFlag } from "@/components/ui/country-flag"
import { cn } from "@/lib/utils"
import { Link2, MousePointer, MousePointerClick, Shield, Ban, AlertTriangle, Bot, Loader2, Monitor, Smartphone, Tablet, Globe } from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"
import NextLink from "next/link"

type Period = "7d" | "30d" | "90d"

const DEVICE_COLORS: Record<string, string> = {
  mobile: "#6366F1",
  desktop: "#8B5CF6",
  tablet: "#A855F7",
  Desconhecido: "#64748B",
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="w-3.5 h-3.5" />,
  desktop: <Monitor className="w-3.5 h-3.5" />,
  tablet: <Tablet className="w-3.5 h-3.5" />,
}

export function AnalyticsContent() {
  const [period, setPeriod] = useState<Period>("7d")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, analyticsRes, linksRes] = await Promise.all([
          api.getDashboardStats(),
          api.getAnalyticsStats(),
          api.getLinks(100, 0),
        ])
        setStats(statsRes.data)
        setAnalyticsStats(analyticsRes.data)
        setLinks(linksRes.data)
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const topLinks = [...links].sort((a, b) => b.totalClicks - a.totalClicks).slice(0, 5)
  const botBlockRate = stats ? Math.round((stats.botsBlocked / Math.max(stats.totalClicks, 1)) * 100) : 0

  const deviceData = analyticsStats?.byDevice.map(d => ({
    name: d.device === 'mobile' ? 'Mobile' : d.device === 'desktop' ? 'Desktop' : d.device === 'tablet' ? 'Tablet' : d.device,
    value: d.count,
    fill: DEVICE_COLORS[d.device] || "#64748B",
  })) || []

  const totalDeviceClicks = deviceData.reduce((acc, d) => acc + d.value, 0)
  const deviceDataWithPercentage = deviceData.map(d => ({
    ...d,
    percentage: totalDeviceClicks > 0 ? Math.round((d.value / totalDeviceClicks) * 100) : 0,
  }))

  const countryData = analyticsStats?.byCountry.map((c, i) => ({
    ...c,
    percentage: stats?.totalClicks ? Math.round((c.count / stats.totalClicks) * 100) : 0,
  })) || []

  const peakHoursData = analyticsStats?.byHour.map(h => ({
    hour: `${h.hour}h-${h.hour + 1}h`,
    clicks: h.count,
    percentage: stats?.totalClicks ? Math.round((h.count / stats.totalClicks) * 100) : 0,
  })) || []

  const maxPeakClicks = Math.max(...peakHoursData.map(h => h.clicks), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-gradient">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visão global dos seus links</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                period === p
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              )}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Links"
          value={stats?.totalLinks || 0}
          icon={<Link2 className="w-4 h-4" />}
          delay={0}
        />
        <MetricCard
          title="Cliques Totais"
          value={stats?.totalClicks || 0}
          icon={<MousePointer className="w-4 h-4" />}
          sparklineData={stats?.clicksByDay.map((d) => d.clicks)}
          delay={50}
        />
        <MetricCard
          title="Cliques Hoje"
          value={stats?.clicksToday || 0}
          icon={<MousePointerClick className="w-4 h-4" />}
          delay={100}
        />
        <MetricCard
          title="Taxa de Bots"
          value={botBlockRate}
          format="percentage"
          icon={<Shield className="w-4 h-4" />}
          delay={150}
        />
      </div>

      {/* Main Chart */}
      <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Cliques ao Longo do Tempo
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.clicksByDay || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(250, 250, 250, 0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 11 }}
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
                  padding: "12px 16px",
                }}
                labelStyle={{ color: "#fafafa", fontWeight: 600 }}
                itemStyle={{ color: "#6366F1" }}
              />
              <Area type="monotone" dataKey="clicks" stroke="#6366F1" strokeWidth={2} fill="url(#analyticsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Top Links */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top 5 Links</h3>
            <NextLink href="/links" className="text-xs text-primary hover:text-primary/80 transition-colors">
              Ver todos
            </NextLink>
          </div>
          <div className="space-y-3">
            {topLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum link ainda</p>
            ) : (
              topLinks.map((link, index) => (
                <NextLink
                  key={link.id}
                  href={`/links/${link.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <span className="text-xs text-muted-foreground w-4 font-medium">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">/{link.shortCode}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {link.totalClicks.toLocaleString("pt-BR")} cliques
                    </p>
                  </div>
                </NextLink>
              ))
            )}
          </div>
        </div>

        {/* Top Countries */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Top Países</h3>
          <div className="space-y-3">
            {countryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Globe className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados ainda</p>
              </div>
            ) : (
              countryData.slice(0, 5).map((country, index) => (
                <div key={country.code} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 font-medium">{index + 1}</span>
                  <CountryFlag code={country.code} className="text-lg" />
                  <span className="text-sm text-foreground flex-1 truncate">{country.country}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{country.percentage}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Dispositivos</h3>
          {deviceDataWithPercentage.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Monitor className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sem dados ainda</p>
            </div>
          ) : (
            <>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceDataWithPercentage}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceDataWithPercentage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {deviceDataWithPercentage.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs text-foreground font-medium tabular-nums">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Peak Hours */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Horários de Pico</h3>
          {peakHoursData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MousePointerClick className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sem dados ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {peakHoursData.map((item) => (
                <div key={item.hour} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.hour}</span>
                    <span className="text-foreground font-medium tabular-nums">{item.clicks}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(item.clicks / maxPeakClicks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fraud Section */}
      <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "450ms" }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-lg bg-rose-500/15">
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proteção contra Fraude</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] text-rose-400 uppercase tracking-wider font-medium">Total Bloqueado</span>
            </div>
            <p className="text-2xl font-semibold text-rose-400 tabular-nums">{stats?.botsBlocked || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Bots Detectados</span>
            </div>
            <p className="text-2xl font-semibold text-amber-400 tabular-nums">{stats?.botsBlocked || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] text-orange-400 uppercase tracking-wider font-medium">Suspeitos</span>
            </div>
            <p className="text-2xl font-semibold text-orange-400 tabular-nums">{analyticsStats?.suspiciousClicks || 0}</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={stats?.clicksByDay.map(d => ({ ...d, fraud: Math.floor(d.clicks * 0.1) })) || []} 
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(250, 250, 250, 0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 11 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 10, 11, 0.95)",
                  border: "1px solid rgba(250, 250, 250, 0.08)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                }}
                labelStyle={{ color: "#fafafa", fontWeight: 600 }}
                itemStyle={{ color: "#f43f5e" }}
              />
              <Area type="monotone" dataKey="fraud" stroke="#f43f5e" strokeWidth={2} fill="url(#fraudGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
