"use client"

import { useState } from "react"
import { mockLinks, analyticsData } from "@/lib/mock-data"
import { MetricCard } from "@/components/ui/metric-card"
import { CountryFlag } from "@/components/ui/country-flag"
import { Sparkline } from "@/components/ui/sparkline"
import { cn } from "@/lib/utils"
import { Link2, MousePointer, MousePointerClick, Shield, Ban, AlertTriangle, Bot } from "lucide-react"
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
} from "recharts"
import Link from "next/link"

type Period = "7d" | "30d" | "90d"

export function AnalyticsContent() {
  const [period, setPeriod] = useState<Period>("7d")

  const fraudData = {
    totalBlocked: 234,
    botsDetected: 189,
    suspiciousClicks: 45,
    fraudOverTime: analyticsData.clicksByDay.map((d) => ({
      ...d,
      fraud: Math.floor(d.clicks * 0.15),
    })),
  }

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
          value={analyticsData.totalLinks}
          icon={<Link2 className="w-4 h-4" />}
          change={12}
          changeLabel="vs. período"
          delay={0}
        />
        <MetricCard
          title="Cliques Totais"
          value={analyticsData.totalClicks}
          icon={<MousePointer className="w-4 h-4" />}
          sparklineData={analyticsData.clicksByDay.map((d) => d.clicks)}
          change={18}
          delay={50}
        />
        <MetricCard
          title="Cliques Hoje"
          value={analyticsData.clicksToday}
          icon={<MousePointerClick className="w-4 h-4" />}
          change={-5}
          delay={100}
        />
        <MetricCard
          title="Taxa de Bots"
          value={analyticsData.botBlockRate}
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
            <AreaChart data={analyticsData.clicksByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
            <Link href="/links" className="text-xs text-primary hover:text-primary/80 transition-colors">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {mockLinks.slice(0, 5).map((link, index) => (
              <Link
                key={link.id}
                href={`/links/${link.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                <span className="text-xs text-muted-foreground w-4 font-medium">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">/{link.shortCode}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {link.clicks.toLocaleString("pt-BR")} cliques
                  </p>
                </div>
                <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                  <Sparkline data={link.clicksHistory} width={40} height={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Top 5 Países</h3>
          <div className="space-y-3">
            {analyticsData.topCountries.map((country, index) => (
              <div key={country.code} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4 font-medium">{index + 1}</span>
                <CountryFlag code={country.code} className="text-lg" />
                <span className="text-sm text-foreground flex-1 truncate">{country.country}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{country.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Dispositivos</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.deviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analyticsData.deviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {analyticsData.deviceDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-xs text-foreground font-medium tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Horários de Pico</h3>
          <div className="space-y-3">
            {[
              { hour: "14h-15h", clicks: 456, percentage: 100 },
              { hour: "15h-16h", clicks: 412, percentage: 90 },
              { hour: "13h-14h", clicks: 389, percentage: 85 },
              { hour: "16h-17h", clicks: 356, percentage: 78 },
              { hour: "12h-13h", clicks: 312, percentage: 68 },
            ].map((item) => (
              <div key={item.hour} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.hour}</span>
                  <span className="text-foreground font-medium tabular-nums">{item.clicks}</span>
                </div>
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
            <p className="text-2xl font-semibold text-rose-400 tabular-nums">{fraudData.totalBlocked}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Bots Detectados</span>
            </div>
            <p className="text-2xl font-semibold text-amber-400 tabular-nums">{fraudData.botsDetected}</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] text-orange-400 uppercase tracking-wider font-medium">Suspeitos</span>
            </div>
            <p className="text-2xl font-semibold text-orange-400 tabular-nums">{fraudData.suspiciousClicks}</p>
          </div>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fraudData.fraudOverTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
