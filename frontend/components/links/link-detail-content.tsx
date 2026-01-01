"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api, type Link as LinkType, type ClickEvent, type LinkAnalytics } from "@/lib/api"
import { StatusBadge } from "@/components/ui/status-badge"
import { MetricCard } from "@/components/ui/metric-card"
import { CountryFlag } from "@/components/ui/country-flag"
import { DeviceIcon } from "@/components/ui/device-icon"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { QRCode } from "@/components/ui/qr-code"
import { useToast } from "@/components/ui/toast"
import { getShortUrl } from "@/lib/constants"
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
  Loader2,
  Download,
} from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export function LinkDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { success, error } = useToast()
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState<LinkType | null>(null)
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null)
  const [clicks, setClicks] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return
      
      try {
        const [linkRes, analyticsRes, clicksRes] = await Promise.all([
          api.getLink(params.id as string),
          api.getLinkAnalytics(params.id as string),
          api.getLinkClicks(params.id as string, 10, 0),
        ])
        setLink(linkRes.data)
        setAnalytics(analyticsRes.data)
        setClicks(clicksRes.data)
      } catch (err) {
        console.error("Failed to fetch link:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  const shortUrl = link ? getShortUrl(link.shortCode) : ""

  const copyToClipboard = async () => {
    if (!link) return
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePauseActivate = async () => {
    if (!link) return
    setActionLoading(true)
    try {
      if (link.state === "paused") {
        const res = await api.activateLink(link.id)
        setLink(res.data)
        success("Link ativado!")
      } else {
        const res = await api.pauseLink(link.id)
        setLink(res.data)
        success("Link pausado!")
      }
    } catch (err) {
      error("Erro ao atualizar link")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!link) return
    setActionLoading(true)
    try {
      await api.deleteLink(link.id)
      success("Link excluído!")
      router.push("/links")
    } catch (err) {
      error("Erro ao excluir link")
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!link) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Link não encontrado</p>
        <Link href="/links" className="text-primary hover:underline mt-2 inline-block">
          Voltar para links
        </Link>
      </div>
    )
  }

  const getDisplayStatus = (): "active" | "paused" | "expired" | "viral" | "sick" => {
    if (link.clicksToday > 100) return "viral"
    if (link.healthScore < 60) return "sick"
    if (link.state === "active") return "active"
    if (link.state === "paused") return "paused"
    if (link.state === "expired") return "expired"
    return "active"
  }

  const deviceDistribution = analytics ? [
    { name: "Mobile", value: analytics.byDevice["mobile"] || 0, fill: "#6366F1" },
    { name: "Desktop", value: analytics.byDevice["desktop"] || 0, fill: "#8B5CF6" },
    { name: "Tablet", value: analytics.byDevice["tablet"] || 0, fill: "#A855F7" },
  ].filter(d => d.value > 0) : []

  const totalDevices = deviceDistribution.reduce((sum, d) => sum + d.value, 0)
  const devicePercentages = deviceDistribution.map(d => ({
    ...d,
    value: totalDevices > 0 ? Math.round((d.value / totalDevices) * 100) : 0
  }))

  const topCountries = analytics ? Object.entries(analytics.byCountry)
    .map(([code, clicks]) => ({ code, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5) : []

  const totalCountryClicks = topCountries.reduce((sum, c) => sum + c.clicks, 0)

  const hourlyData = analytics ? Array.from({ length: 24 }, (_, hour) => ({
    hour,
    clicks: analytics.byHour[hour] || 0,
  })) : []

  const maxHourlyClicks = Math.max(...hourlyData.map(h => h.clicks), 1)

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
                    link.healthScore >= 80 ? "text-emerald-400" : link.healthScore >= 60 ? "text-amber-400" : "text-rose-400",
                  )}
                >
                  {link.healthScore}%
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
          <Button 
            variant="outline" 
            className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-10"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1'}/links/${link.id}/export`, '_blank')}
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-10"
            onClick={handlePauseActivate}
            disabled={actionLoading}
          >
            {link.state === "paused" ? (
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
          <Button variant="outline" className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-10" asChild>
            <Link href={`/links/${link.id}/edit`}>
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-white/[0.08] hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 bg-transparent h-10"
            onClick={() => setShowDeleteModal(true)}
            disabled={actionLoading}
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
          value={link.totalClicks}
          icon={<MousePointer className="w-4 h-4" />}
          delay={0}
        />
        <MetricCard title="Únicos" value={link.uniqueClicks} icon={<Users className="w-4 h-4" />} delay={50} />
        <MetricCard
          title="Hoje"
          value={link.clicksToday}
          icon={<MousePointerClick className="w-4 h-4" />}
          delay={100}
        />
        <MetricCard
          title="Trust Score"
          value={link.trustScore}
          format="percentage"
          icon={<Shield className="w-4 h-4" />}
          delay={150}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device distribution */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Dispositivos</h3>
          {devicePercentages.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devicePercentages}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {devicePercentages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {devicePercentages.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs text-muted-foreground">
                      {item.name} <span className="text-foreground font-medium">{item.value}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados ainda</p>
          )}
        </div>

        {/* Top countries */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Top 5 Países</h3>
          {topCountries.length > 0 ? (
            <div className="space-y-4">
              {topCountries.map((country, index) => (
                <div key={country.code} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-4 font-medium">{index + 1}</span>
                  <CountryFlag code={country.code} className="text-xl" />
                  <span className="text-sm text-foreground flex-1 font-medium">{country.code}</span>
                  <div className="w-20 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                      style={{ width: `${totalCountryClicks > 0 ? (country.clicks / totalCountryClicks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-14 text-right tabular-nums">
                    {country.clicks.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados ainda</p>
          )}
        </div>

        {/* Hour heatmap */}
        <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">Cliques por Hora</h3>
          <div className="grid grid-cols-12 gap-1.5">
            {hourlyData.map((item) => {
              const intensity = item.clicks / maxHourlyClicks
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
        {clicks.length > 0 ? (
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
                {clicks.map((click) => (
                  <tr key={click.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(click.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <CountryFlag code={click.country || "BR"} className="text-lg" />
                        <span className="text-sm text-foreground">{click.country || "Desconhecido"}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <DeviceIcon device={click.device as "mobile" | "desktop" | "tablet"} className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground capitalize">{click.device}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{click.referrer || "Direto"}</td>
                    <td className="py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wide",
                          !click.isBot && !click.isSuspicious && "text-emerald-400 bg-emerald-500/10",
                          click.isBot && "text-rose-400 bg-rose-500/10",
                          click.isSuspicious && !click.isBot && "text-amber-400 bg-amber-500/10",
                        )}
                      >
                        {click.isBot ? "Bot" : click.isSuspicious ? "Suspeito" : "Legítimo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum clique registrado ainda</p>
        )}
      </div>

      {/* Smart Rules Section */}
      {link.rules && link.rules.length > 0 && (
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
                  {rule.conditions.map((cond, i) => (
                    <span key={i} className="text-sm text-foreground">
                      Se <span className="font-mono text-primary font-medium">{cond.field}</span>{" "}
                      <span className="text-muted-foreground">
                        {cond.operator === "eq" ? "for igual a" : cond.operator === "neq" ? "for diferente de" : "contém"}
                      </span>{" "}
                      <span className="font-mono text-primary font-medium">{String(cond.value)}</span>
                    </span>
                  ))}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">{rule.targetUrl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Section */}
      <div className="glass-card rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="flex flex-col lg:flex-row">
          {/* QR Code side */}
          <div className="lg:w-72 p-8 flex items-center justify-center bg-[#0a0a0b] relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }} />
            </div>
            <QRCode value={shortUrl} size={180} />
          </div>
          
          {/* Info side */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <rect x="18" y="14" width="3" height="3" />
                  <rect x="14" y="18" width="3" height="3" />
                  <rect x="18" y="18" width="3" height="3" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foreground">QR Code</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Escaneie com a câmera do celular para acessar o link instantaneamente. Perfeito para materiais impressos, apresentações ou compartilhamento rápido.
            </p>
            
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-6">
              <p className="text-xs text-muted-foreground mb-1">Link encurtado</p>
              <p className="font-mono text-sm text-foreground break-all">{shortUrl}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent flex-1 lg:flex-none"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 border-white/[0.08] hover:bg-white/[0.04] bg-transparent flex-1 lg:flex-none"
                onClick={() => window.open(shortUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Excluir link"
        description={`Tem certeza que deseja excluir /${link.shortCode}? Esta ação não pode ser desfeita.`}
        confirmText={actionLoading ? "Excluindo..." : "Excluir"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
