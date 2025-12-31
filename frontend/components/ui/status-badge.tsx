import { cn } from "@/lib/utils"
import { Zap, Pause, Clock, TrendingUp, AlertTriangle } from "lucide-react"

interface StatusBadgeProps {
  status: "active" | "paused" | "expired" | "viral" | "sick"
  className?: string
  showIcon?: boolean
}

const statusConfig = {
  active: {
    label: "Ativo",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    icon: Zap,
  },
  paused: {
    label: "Pausado",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    icon: Pause,
  },
  expired: {
    label: "Expirado",
    dotColor: "bg-white/30",
    bgColor: "bg-white/[0.04]",
    textColor: "text-muted-foreground",
    icon: Clock,
  },
  viral: {
    label: "Viral",
    dotColor: "bg-primary",
    bgColor: "bg-primary/15",
    textColor: "text-primary",
    icon: TrendingUp,
  },
  sick: {
    label: "Baixa",
    dotColor: "bg-orange-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    icon: AlertTriangle,
  },
}

export function StatusBadge({ status, className, showIcon = false }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wide",
        config.bgColor,
        config.textColor,
        className,
      )}
    >
      {showIcon ? (
        <Icon className={cn("w-3 h-3", status === "viral" && "animate-pulse")} />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor, status === "viral" && "animate-pulse")} />
      )}
      {config.label}
    </div>
  )
}
