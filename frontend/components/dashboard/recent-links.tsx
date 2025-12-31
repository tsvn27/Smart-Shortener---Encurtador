"use client"

import Link from "next/link"
import type { Link as LinkType } from "@/lib/mock-data"
import { StatusBadge } from "@/components/ui/status-badge"
import { Sparkline } from "@/components/ui/sparkline"
import { ExternalLink, Copy, Check, ArrowRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface RecentLinksProps {
  links: LinkType[]
}

export function RecentLinks({ links }: RecentLinksProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (shortCode: string, id: string) => {
    await navigator.clipboard.writeText(`https://sho.rt/${shortCode}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getDisplayStatus = (link: LinkType) => {
    if (link.clicksToday > 100) return "viral"
    if (link.health < 60) return "sick"
    return link.status
  }

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links Recentes</h3>
        <Link
          href="/links"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors group"
        >
          Ver todos
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {links.map((link, index) => (
          <Link
            key={link.id}
            href={`/links/${link.id}`}
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl border border-transparent transition-all duration-200 group",
              "hover:bg-white/[0.03] hover:border-white/[0.06]",
              link.clicksToday > 100 && "border-primary/20 bg-primary/[0.03]",
            )}
            style={{ animationDelay: `${350 + index * 50}ms` }}
          >
            {/* Short code */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">/{link.shortCode}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    copyToClipboard(link.shortCode, link.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/10"
                >
                  {copiedId === link.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[180px]">{link.originalUrl}</p>
            </div>

            {/* Sparkline */}
            <div className="hidden sm:block opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkline data={link.clicksHistory} width={60} height={20} />
            </div>

            {/* Stats */}
            <div className="text-right min-w-[60px]">
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {link.clicks.toLocaleString("pt-BR")}
              </p>
              <p className="text-[10px] text-muted-foreground">cliques</p>
            </div>

            {/* Status */}
            <StatusBadge status={getDisplayStatus(link)} />

            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  )
}
