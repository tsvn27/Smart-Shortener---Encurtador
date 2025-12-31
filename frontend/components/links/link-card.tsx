"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import type { Link as LinkType } from "@/lib/api"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useToast } from "@/components/ui/toast"
import { getShortUrl } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Copy, Check, MoreHorizontal, ExternalLink, Pencil, Pause, Play, Trash2, BarChart3 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LinkCardProps {
  link: LinkType
  viewMode: "grid" | "list"
  onDeleted?: () => void
  onUpdated?: (link: LinkType) => void
}

export function LinkCard({ link, viewMode, onDeleted, onUpdated }: LinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const { success, error } = useToast()

  const shortUrl = getShortUrl(link.shortCode)

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleState = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsToggling(true)
    try {
      const res = link.state === "paused" 
        ? await api.activateLink(link.id)
        : await api.pauseLink(link.id)
      onUpdated?.(res.data)
      success(link.state === "paused" ? "Link ativado!" : "Link pausado!")
    } catch (err) {
      error("Erro ao atualizar link")
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.deleteLink(link.id)
      onDeleted?.()
      success("Link excluído!")
    } catch (err) {
      error("Erro ao excluir link")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const getDisplayStatus = (): "active" | "paused" | "expired" | "viral" | "sick" => {
    if (link.clicksToday > 100) return "viral"
    if (link.healthScore < 60) return "sick"
    if (link.state === "active") return "active"
    if (link.state === "paused") return "paused"
    if (link.state === "expired") return "expired"
    return "active"
  }

  const isViral = link.clicksToday > 100

  if (viewMode === "list") {
    return (
      <>
        <Link
          href={`/links/${link.id}`}
          className={cn(
            "glass-card rounded-xl p-4 flex items-center gap-4 transition-all duration-200",
            "hover:border-white/[0.1] hover:-translate-y-0.5 group",
            isViral && "border-primary/20 bg-primary/[0.02]",
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">/{link.shortCode}</span>
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1 rounded hover:bg-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{link.originalUrl}</p>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            {link.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-[10px] rounded-md bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>

          <div className="text-right min-w-[80px]">
            <p className="text-sm font-semibold text-foreground tabular-nums">{link.totalClicks.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] text-muted-foreground">cliques</p>
          </div>

          <StatusBadge status={getDisplayStatus()} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0b]/95 backdrop-blur-xl border-white/[0.08]">
              <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                <Link href={`/links/${link.id}`}>
                  <BarChart3 className="w-4 h-4" />
                  Ver Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                <Link href={`/links/${link.id}/edit`}>
                  <Pencil className="w-4 h-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => window.open(shortUrl, "_blank")}>
                <ExternalLink className="w-4 h-4" />
                Abrir link
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleToggleState} disabled={isToggling}>
                {link.state === "paused" ? <><Play className="w-4 h-4" />Ativar</> : <><Pause className="w-4 h-4" />Pausar</>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 text-rose-400 focus:text-rose-300 cursor-pointer" 
                onClick={(e) => { e.preventDefault(); setShowDeleteModal(true) }}
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Link>

        <ConfirmModal
          open={showDeleteModal}
          title="Excluir link"
          description={`Tem certeza que deseja excluir /${link.shortCode}? Esta ação não pode ser desfeita.`}
          confirmText={isDeleting ? "Excluindo..." : "Excluir"}
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      </>
    )
  }

  return (
    <>
      <Link
        href={`/links/${link.id}`}
        className={cn(
          "glass-card rounded-xl p-5 flex flex-col transition-all duration-200 relative group",
          "hover:border-white/[0.1] hover:-translate-y-1",
          isViral && "border-primary/20",
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base font-semibold text-foreground">/{link.shortCode}</span>
            <button
              onClick={copyToClipboard}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all p-1.5 rounded-lg hover:bg-white/10"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={getDisplayStatus()} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0b]/95 backdrop-blur-xl border-white/[0.08]">
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href={`/links/${link.id}`}>
                    <BarChart3 className="w-4 h-4" />
                    Ver Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href={`/links/${link.id}/edit`}>
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => window.open(shortUrl, "_blank")}>
                  <ExternalLink className="w-4 h-4" />
                  Abrir link
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleToggleState} disabled={isToggling}>
                  {link.state === "paused" ? <><Play className="w-4 h-4" />Ativar</> : <><Pause className="w-4 h-4" />Pausar</>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 text-rose-400 focus:text-rose-300 cursor-pointer" 
                  onClick={(e) => { e.preventDefault(); setShowDeleteModal(true) }}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-xs text-muted-foreground truncate mb-5">{link.originalUrl}</p>

        <div className="flex items-end justify-between pt-4 border-t border-white/[0.06]">
          <div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{link.totalClicks.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">cliques totais</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground tabular-nums">{link.clicksToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">hoje</p>
          </div>
        </div>

        {link.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-4 flex-wrap">
            {link.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-[10px] rounded-md bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      <ConfirmModal
        open={showDeleteModal}
        title="Excluir link"
        description={`Tem certeza que deseja excluir /${link.shortCode}? Esta ação não pode ser desfeita.`}
        confirmText={isDeleting ? "Excluindo..." : "Excluir"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  )
}
