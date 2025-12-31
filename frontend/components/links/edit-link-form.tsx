"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { api, type Link as LinkType } from "@/lib/api"
import { ArrowLeft, Link2, Tag, Shield, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function EditLinkForm() {
  const params = useParams()
  const router = useRouter()
  const { success, error } = useToast()
  
  const [link, setLink] = useState<LinkType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [url, setUrl] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [campaign, setCampaign] = useState("")
  const [maxClicks, setMaxClicks] = useState("")
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
    async function loadLink() {
      if (!params.id) return
      try {
        const res = await api.getLink(params.id as string)
        const data = res.data
        setLink(data)
        setUrl(data.originalUrl)
        setTags(data.tags || [])
        setCampaign(data.campaign || "")
        setMaxClicks(data.limits?.maxClicks?.toString() || "")
        if (data.limits?.expiresAt) {
          setExpiresAt(new Date(data.limits.expiresAt).toISOString().slice(0, 16))
        }
      } catch (err) {
        error("Erro ao carregar link")
        router.push("/links")
      } finally {
        setIsLoading(false)
      }
    }
    loadLink()
  }, [params.id, router, error])

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!link) return
    
    setIsSaving(true)
    try {
      const limits: Record<string, unknown> = {}
      if (maxClicks) limits.maxClicks = parseInt(maxClicks)
      if (expiresAt) limits.expiresAt = new Date(expiresAt).toISOString()

      await api.updateLink(link.id, {
        url,
        tags: tags.length > 0 ? tags : undefined,
        campaign: campaign || undefined,
        limits: Object.keys(limits).length > 0 ? limits : undefined,
      })
      
      success("Link atualizado!")
      router.push(`/links/${link.id}`)
    } catch (err) {
      error("Erro ao atualizar link")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!link) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link
          href={`/links/${link.id}`}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.08]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gradient">Editar Link</h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">/{link.shortCode}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL */}
        <div className="glass-card rounded-xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">URL de Destino</h2>
              <p className="text-xs text-muted-foreground">Para onde o link redireciona</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 bg-white/[0.03] border-white/[0.08]"
              required
            />
          </div>
        </div>

        {/* Limits */}
        <div className="glass-card rounded-xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Limites</h2>
              <p className="text-xs text-muted-foreground">Restrições de uso</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Máximo de cliques</Label>
              <Input
                type="number"
                placeholder="Ilimitado"
                value={maxClicks}
                onChange={(e) => setMaxClicks(e.target.value)}
                className="h-10 bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expira em</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-10 bg-white/[0.03] border-white/[0.08]"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card rounded-xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Organização</h2>
              <p className="text-xs text-muted-foreground">Tags e campanha</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Input
                placeholder="Digite e pressione Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                className="h-10 bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Campanha</Label>
              <Input
                placeholder="Ex: Black Friday 2024"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="h-10 bg-white/[0.03] border-white/[0.08]"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <Link href={`/links/${link.id}`}>
            <Button type="button" variant="outline" className="border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-11 px-5">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="gap-2 h-11 px-6">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  )
}
