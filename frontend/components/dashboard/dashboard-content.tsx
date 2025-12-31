"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Link2, 
  MousePointer, 
  MousePointerClick, 
  Shield, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Zap,
  BarChart3,
  Globe,
  ArrowUpRight,
  Plus,
  Flame,
  Trophy,
  Medal,
  Award,
  Heart,
  Crown
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { api, Link as LinkType, DashboardStats } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CountryFlag } from "@/components/ui/country-flag"
import { Button } from "@/components/ui/button"

export function DashboardContent() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [links, setLinks] = useState<LinkType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, linksRes] = await Promise.all([
          api.getDashboardStats(),
          api.getLinks(10, 0),
        ])
        setStats(statsRes.data)
        setLinks(linksRes.data)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const firstName = user?.name?.split(" ")[0] || "Usuário"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  // Calculate performance metrics
  const totalClicks = stats?.totalClicks || 0
  const clicksToday = stats?.clicksToday || 0
  const avgClicksPerLink = links.length > 0 ? Math.round(totalClicks / links.length) : 0
  const topLink = links.length > 0 ? links.reduce((a, b) => a.totalClicks > b.totalClicks ? a : b) : null
  const viralLinks = links.filter(l => l.clicksToday > 100).length
  const healthyLinks = links.filter(l => l.healthScore >= 80).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 animate-fade-in">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting},</p>
          <h1 className="text-3xl font-semibold text-gradient">{firstName}</h1>
        </div>
        <Link href="/links/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90 h-10">
            <Plus className="w-4 h-4" />
            Novo Link
          </Button>
        </Link>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cliques Hoje"
          value={clicksToday}
          icon={<Zap className="w-4 h-4" />}
          trend={clicksToday > 0 ? "+12%" : undefined}
          trendUp={true}
          highlight
          delay={0}
        />
        <StatCard
          label="Total de Cliques"
          value={totalClicks}
          icon={<MousePointer className="w-4 h-4" />}
          delay={50}
        />
        <StatCard
          label="Links Ativos"
          value={links.filter(l => l.state === "active").length}
          icon={<Link2 className="w-4 h-4" />}
          subtitle={`de ${links.length} total`}
          delay={100}
        />
        <StatCard
          label="Bots Bloqueados"
          value={stats?.botsBlocked || 0}
          icon={<Shield className="w-4 h-4" />}
          delay={150}
        />
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Cliques</span>
              </div>
            </div>
          </div>
          
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.clicksByDay || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(250, 250, 250, 0.4)", fontSize: 10 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 10, 11, 0.95)",
                    border: "1px solid rgba(250, 250, 250, 0.08)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#fafafa", fontSize: 12 }}
                  formatter={(value: number) => [value.toLocaleString("pt-BR"), "Cliques"]}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#dashGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <h3 className="text-sm font-medium text-foreground mb-6">Resumo Rápido</h3>
          
          <div className="space-y-5">
            <QuickStat
              icon={<BarChart3 className="w-4 h-4 text-primary" />}
              label="Média por link"
              value={avgClicksPerLink.toLocaleString("pt-BR")}
              suffix="cliques"
            />
            <QuickStat
              icon={<Flame className="w-4 h-4 text-orange-400" />}
              label="Links virais"
              value={viralLinks.toString()}
              suffix={viralLinks === 1 ? "link" : "links"}
              highlight={viralLinks > 0}
            />
            <QuickStat
              icon={<Heart className="w-4 h-4 text-emerald-400" />}
              label="Saúde geral"
              value={`${links.length > 0 ? Math.round((healthyLinks / links.length) * 100) : 0}%`}
              suffix="saudáveis"
            />
            <QuickStat
              icon={<Crown className="w-4 h-4 text-amber-400" />}
              label="Plano atual"
              value={user?.plan === "free" ? "Gratuito" : user?.plan === "pro" ? "Pro" : "Enterprise"}
              suffix={`${user?.maxLinks || 10} links`}
            />
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-foreground">Top Links</h3>
            <Link href="/links" className="text-xs text-primary hover:text-primary/80 transition-colors">
              Ver todos →
            </Link>
          </div>
          
          {links.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {links.slice(0, 5).sort((a, b) => b.totalClicks - a.totalClicks).map((link, i) => (
                <LinkRow key={link.id} link={link} rank={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-foreground">Atividade Recente</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Ao vivo
            </span>
          </div>
          
          {links.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {links.slice(0, 5).map((link, i) => (
                <ActivityRow key={link.id} link={link} delay={i * 50} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  trendUp, 
  subtitle,
  highlight,
  delay 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  subtitle?: string
  highlight?: boolean
  delay: number
}) {
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-5 animate-fade-in",
        highlight && "border-primary/20 bg-primary/[0.02]"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "p-2 rounded-lg",
          highlight ? "bg-primary/20 text-primary" : "bg-white/[0.04] text-muted-foreground"
        )}>
          {icon}
        </span>
        {trend && (
          <span className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trendUp ? "text-emerald-400" : "text-rose-400"
          )}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className={cn(
        "text-2xl font-semibold tabular-nums",
        highlight ? "text-primary" : "text-foreground"
      )}>
        {value.toLocaleString("pt-BR")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function QuickStat({ 
  icon, 
  label, 
  value, 
  suffix,
  highlight 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  suffix: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="p-2 rounded-lg bg-white/[0.04]">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          "text-sm font-medium",
          highlight ? "text-amber-400" : "text-foreground"
        )}>
          {value} <span className="text-muted-foreground font-normal">{suffix}</span>
        </p>
      </div>
    </div>
  )
}

function LinkRow({ link, rank }: { link: LinkType; rank: number }) {
  const isViral = link.clicksToday > 100
  
  const RankIcon = rank === 1 ? Trophy : rank === 2 ? Medal : rank === 3 ? Award : null
  
  return (
    <Link
      href={`/links/${link.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all group",
        "hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06]",
        isViral && "border-primary/20 bg-primary/[0.02]"
      )}
    >
      <span className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-medium",
        rank === 1 ? "bg-amber-500/20 text-amber-400" :
        rank === 2 ? "bg-zinc-400/20 text-zinc-400" :
        rank === 3 ? "bg-orange-500/20 text-orange-400" :
        "bg-white/[0.04] text-muted-foreground"
      )}>
        {RankIcon ? <RankIcon className="w-3.5 h-3.5" /> : rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono text-foreground truncate">/{link.shortCode}</p>
        <p className="text-[10px] text-muted-foreground truncate">{link.originalUrl}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {link.totalClicks.toLocaleString("pt-BR")}
        </p>
        {isViral && (
          <span className="flex items-center gap-1 text-[10px] text-primary font-medium justify-end">
            <Flame className="w-3 h-3" /> viral
          </span>
        )}
      </div>
      <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

function ActivityRow({ link, delay }: { link: LinkType; delay: number }) {
  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg animate-fade-in"
      style={{ animationDelay: `${400 + delay}ms` }}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        link.state === "active" ? "bg-emerald-500" : "bg-muted-foreground"
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground">
          <span className="font-mono text-primary">/{link.shortCode}</span>
          {link.clicksToday > 0 && (
            <span className="text-muted-foreground"> recebeu </span>
          )}
          {link.clicksToday > 0 && (
            <span className="text-foreground font-medium">{link.clicksToday} cliques</span>
          )}
          {link.clicksToday === 0 && (
            <span className="text-muted-foreground"> sem cliques hoje</span>
          )}
        </p>
      </div>
      {link.clicksToday > 100 && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-primary/15 text-primary font-medium">
          <Flame className="w-3 h-3" /> Viral
        </span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
        <Link2 className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-3">Nenhum link criado ainda</p>
      <Link href="/links/new">
        <Button size="sm" variant="outline" className="gap-2 border-white/[0.08] bg-transparent">
          <Plus className="w-3 h-3" />
          Criar primeiro link
        </Button>
      </Link>
    </div>
  )
}
