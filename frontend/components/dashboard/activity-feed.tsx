"use client"

import type { ClickEvent } from "@/lib/mock-data"
import { CountryFlag } from "@/components/ui/country-flag"
import { DeviceIcon } from "@/components/ui/device-icon"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ActivityFeedProps {
  clicks: ClickEvent[]
}

export function ActivityFeed({ clicks }: ActivityFeedProps) {
  const statusConfig = {
    legitimate: { color: "bg-emerald-500", label: "OK", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    bot: { color: "bg-rose-500", label: "Bot", bg: "bg-rose-500/10", text: "text-rose-400" },
    suspicious: { color: "bg-amber-500", label: "?", bg: "bg-amber-500/10", text: "text-amber-400" },
  }

  return (
    <div className="glass-card rounded-xl p-6 h-full flex flex-col animate-fade-in" style={{ animationDelay: "250ms" }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Atividade ao Vivo</h3>
        <span className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Online
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {clicks.map((click, index) => {
          const status = statusConfig[click.status]
          return (
            <div
              key={click.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
              style={{ animationDelay: `${300 + index * 50}ms` }}
            >
              {/* Status dot */}
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", status.color)} />

              {/* Flag */}
              <CountryFlag code={click.countryCode} className="text-lg flex-shrink-0" />

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <DeviceIcon device={click.device} className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground truncate">{click.referrer || "Direto"}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(click.timestamp), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              {/* Status badge */}
              <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-medium", status.bg, status.text)}>
                {status.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
