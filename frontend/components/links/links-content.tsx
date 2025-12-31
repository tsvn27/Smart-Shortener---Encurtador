"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Search, Filter, Grid3X3, List, PlusCircle, X, Link2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, Link as LinkType } from "@/lib/api"
import { LinkCard } from "./link-card"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "list"
type StatusFilter = "all" | "active" | "paused" | "expired"

const ITEMS_PER_PAGE = 12

export function LinksContent() {
  const [links, setLinks] = useState<LinkType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    async function loadLinks() {
      try {
        const res = await api.getLinks(100, 0)
        setLinks(res.data)
      } catch (error) {
        console.error("Failed to load links:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadLinks()
  }, [])

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        link.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === "all" || link.state === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [links, searchQuery, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredLinks.length / ITEMS_PER_PAGE)
  const paginatedLinks = filteredLinks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleLinkDeleted = (id: string) => {
    setLinks(links.filter(l => l.id !== id))
  }

  const handleLinkUpdated = (updatedLink: LinkType) => {
    setLinks(links.map(l => l.id === updatedLink.id ? updatedLink : l))
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 w-32 skeleton rounded-lg" />
            <div className="h-4 w-24 skeleton rounded mt-2" />
          </div>
          <div className="h-11 w-32 skeleton rounded-lg" />
        </div>
        <div className="flex gap-4">
          <div className="h-11 flex-1 skeleton rounded-xl" />
          <div className="h-11 w-64 skeleton rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold text-gradient">Links</h1>
          <p className="text-muted-foreground mt-1 text-sm">{links.length} links criados</p>
        </div>

        <Link href="/links/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <PlusCircle className="w-4 h-4 relative" />
            <span className="relative">Novo Link</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, URL ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.05] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            {(["all", "active", "paused", "expired"] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                )}
              >
                {status === "all"
                  ? "Todos"
                  : status === "active"
                    ? "Ativos"
                    : status === "paused"
                      ? "Pausados"
                      : "Expirados"}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-200",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2.5 rounded-lg transition-all duration-200",
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Links Grid/List */}
      {filteredLinks.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
            <Link2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {links.length === 0 ? "Nenhum link criado" : "Nenhum link encontrado"}
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            {links.length === 0 
              ? "Crie seu primeiro link para começar a rastrear cliques"
              : "Tente ajustar sua busca ou filtros para encontrar o que procura"
            }
          </p>
          {links.length === 0 ? (
            <Link href="/links/new">
              <Button className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Criar primeiro link
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="border-white/[0.08] hover:bg-white/[0.04] bg-transparent"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className={cn(
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3",
            )}
          >
            {paginatedLinks.map((link, index) => (
              <div key={link.id} className="animate-fade-in" style={{ animationDelay: `${100 + index * 30}ms` }}>
                <LinkCard 
                  link={link} 
                  viewMode={viewMode} 
                  onDeleted={() => handleLinkDeleted(link.id)}
                  onUpdated={handleLinkUpdated}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 animate-fade-in">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-white/[0.08] bg-transparent h-9 w-9 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1
                  const isActive = page === currentPage
                  const isNearCurrent = Math.abs(page - currentPage) <= 1
                  const isEdge = page === 1 || page === totalPages
                  
                  if (!isNearCurrent && !isEdge && totalPages > 5) {
                    if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="px-1 text-muted-foreground">...</span>
                    }
                    return null
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "h-9 min-w-9 px-3 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      )}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-white/[0.08] bg-transparent h-9 w-9 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
