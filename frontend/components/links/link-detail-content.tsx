"use client"

import { useState } from "react"
import Link from "next/link"
import { mockLinks, mockClicks, analyticsData } from "@/lib/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import { MetricCard } from "@/components/ui/metric-card"
import { CountryFlag } from "@/components/ui/country-flag"
import { DeviceIcon } from "@/components/ui/device-icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Pause,
  Play,
  Pencil,
  Trash2,
  MousePointer,
  Users,
  MousePointerClick,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react"
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

export function LinkDetailContent() {
  const [copied, setCopied] = useState(false)

  const link = mockLinks[0]

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(`https://sho.rt/${link.shortCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getDisplayStatus = () => {
    if (link.clicksToday > 100) return "viral"
    if (link.health < 60) return "sick"
    return link.status
  }

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    clicks: Math.floor(Math.random() * 100) + 10,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <Link
            href="/links"
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.08]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-mono font-semibold text-gradient">/{link.shortCode}</h1>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <StatusBadge status={getDisplayStatus()} showIcon />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span
                  className={cn(
                    "font-medium",
                    link.health >= 80 ? "text-emerald-400" : link.health >= 60 ? "text-amber-400" : "text-rose-400",
                  )}
                >
                  {link.health}%
                </span>
              </div>
            </div>
            <a
              href={link.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mt-2 transition-colors group"
            >
              {link.originalUrl.length > 50 ? link.originalUrl.slice(0, 50) + "..." : link.originalUrl}
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-10">
            {link.status === "paused" ? (
              <>
                <Play className="w-4 h-4" />
                Ativar
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pausar
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-10">
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-white/[0.08] hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 bg-transparent h-10"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cliques Totais"
          value={link.clicks}
          icon={<MousePointer className="w-4 h-4" />}
          sparklineData={link.clicksHistory}
          delay={0}
        />
        <MetricCard title="Únicos" value={link.uniqueClicks} icon={<Users className="w-4 h-4" />} delay={50} />
        <MetricCard
          title="Hoje"
          value={link.clicksToday}
          icon={<MousePointerClick className="w-4 h-4" />}
          change={link.clicksToday > 100 ? 150 : 12}
          delay={100}
        />
        <MetricCard
          title="Trust Score"
          value={link.health}
          format="percentage"
          icon={<Shield className="w-4 h-4" />}
          delay={150}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clicks over time */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Cliques ao longo do tempo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.clicksByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 11 }} />
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
                <Area type="monotone" dataKey="clicks" stroke="#6366F1" strokeWidth={2} fill="url(#detailGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device distribution */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Dispositivos</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.deviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
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
          <div className="flex justify-center gap-6 mt-4">
            {analyticsData.deviceDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-muted-foreground">
                  {item.name} <span className="text-foreground font-medium">{item.value}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row: Countries + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top countries */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Top 5 Países</h3>
          <div className="space-y-4">
            {analyticsData.topCountries.map((country, index) => (
              <div key={country.code} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-4 font-medium">{index + 1}</span>
                <CountryFlag code={country.code} className="text-xl" />
                <span className="text-sm text-foreground flex-1 font-medium">{country.country}</span>
                <div className="w-28 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${country.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-14 text-right tabular-nums">
                  {country.clicks.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hour heatmap */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Cliques por Hora</h3>
          <div className="grid grid-cols-12 gap-1.5">
            {hourlyData.map((item) => {
              const intensity = item.clicks / 100
              return (
                <div
                  key={item.hour}
                  className="aspect-square rounded-md relative group cursor-pointer transition-transform hover:scale-110"
                  style={{
                    backgroundColor: `rgba(99, 102, 241, ${Math.max(intensity * 0.8, 0.1)})`,
                  }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-[#0a0a0b] border border-white/[0.1] text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                    {item.hour}h: <span className="font-semibold">{item.clicks}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>0h</span>
            <span>12h</span>
            <span>23h</span>
          </div>
        </div>
      </div>

      {/* Recent clicks table */}
      <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Cliques Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[10px] font-medium text-muted-foreground pb-4 uppercase tracking-wider">
                  Quando
                </th>
                <th className="text-left text-[10px] font-medium text-muted-foreground pb-4 uppercase tracking-wider">
                  País
                </th>
                <th className="text-left text-[10px] font-medium text-muted-foreground pb-4 uppercase tracking-wider">
                  Dispositivo
                </th>
                <th className="text-left text-[10px] font-medium text-muted-foreground pb-4 uppercase tracking-wider">
                  Referrer
                </th>
                <th className="text-left text-[10px] font-medium text-muted-foreground pb-4 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockClicks.map((click) => (
                <tr key={click.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(click.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2.5">
                      <CountryFlag code={click.countryCode} className="text-lg" />
                      <span className="text-sm text-foreground">{click.country}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2.5">
                      <DeviceIcon device={click.device} className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground capitalize">{click.device}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">{click.referrer || "Direto"}</td>
                  <td className="py-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wide",
                        click.status === "legitimate" && "text-emerald-400 bg-emerald-500/10",
                        click.status === "bot" && "text-rose-400 bg-rose-500/10",
                        click.status === "suspicious" && "text-amber-400 bg-amber-500/10",
                      )}
                    >
                      {click.status === "legitimate" ? "Legítimo" : click.status === "bot" ? "Bot" : "Suspeito"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Rules Section */}
      {link.rules.length > 0 && (
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "450ms" }}>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-lg bg-primary/15">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Regras Ativas</h3>
          </div>
          <div className="space-y-3">
            {link.rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
              >
                <div className="flex-1">
                  <span className="text-sm text-foreground">
                    Se <span className="font-mono text-primary font-medium">{rule.field}</span>{" "}
                    <span className="text-muted-foreground">
                      {rule.operator === "=" ? "for igual a" : rule.operator === "!=" ? "for diferente de" : "contém"}
                    </span>{" "}
                    <span className="font-mono text-primary font-medium">{rule.value}</span>
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">{rule.redirectUrl}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
