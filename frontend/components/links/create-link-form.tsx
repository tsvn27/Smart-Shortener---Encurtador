"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Link2,
  Sparkles,
  Shield,
  Tag,
  ChevronDown,
  Plus,
  X,
  Loader2,
  Globe,
  Smartphone,
  Languages,
  Clock,
  ArrowRight,
  Check,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { api, type RedirectRule, type RuleCondition } from "@/lib/api"

interface SmartRule {
  id: string
  field: "country" | "device" | "language" | "time"
  operator: "=" | "!=" | "contains"
  value: string
  redirectUrl: string
}

const fieldOptions = [
  { value: "country", label: "País", icon: Globe },
  { value: "device", label: "Dispositivo", icon: Smartphone },
  { value: "language", label: "Idioma", icon: Languages },
  { value: "time", label: "Hora", icon: Clock },
]

const operatorOptions = [
  { value: "=", label: "é igual a" },
  { value: "!=", label: "é diferente de" },
  { value: "contains", label: "contém" },
]

export function CreateLinkForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [customCode, setCustomCode] = useState("")
  const [rules, setRules] = useState<SmartRule[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [campaign, setCampaign] = useState("")
  const [maxClicks, setMaxClicks] = useState("")
  const [maxClicksPerDay, setMaxClicksPerDay] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [rulesOpen, setRulesOpen] = useState(false)
  const [limitsOpen, setLimitsOpen] = useState(false)
  const [orgOpen, setOrgOpen] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const addRule = () => {
    const newRule: SmartRule = {
      id: Math.random().toString(36).slice(2),
      field: "country",
      operator: "=",
      value: "",
      redirectUrl: "",
    }
    setRules([...rules, newRule])
  }

  const updateRule = (id: string, updates: Partial<SmartRule>) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }

  const removeRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

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
    setIsLoading(true)
    setError(null)
    
    try {
      // Convert smart rules to API format
      const apiRules: RedirectRule[] = rules
        .filter(r => r.value && r.redirectUrl)
        .map((rule, index) => {
          const operatorMap: Record<string, RuleCondition["operator"]> = {
            "=": "eq",
            "!=": "neq",
            "contains": "contains",
          }
          return {
            id: rule.id,
            priority: index + 1,
            conditions: [{
              field: rule.field,
              operator: operatorMap[rule.operator],
              value: rule.value,
            }],
            targetUrl: rule.redirectUrl,
            active: true,
          }
        })
      
      // Build limits object
      const limits: Record<string, unknown> = {}
      if (maxClicks) limits.maxClicks = parseInt(maxClicks)
      if (maxClicksPerDay) limits.maxClicksPerDay = parseInt(maxClicksPerDay)
      if (expiresAt) limits.expiresAt = new Date(expiresAt).toISOString()
      
      await api.createLink({
        url,
        customCode: customCode || undefined,
        rules: apiRules.length > 0 ? apiRules : undefined,
        limits: Object.keys(limits).length > 0 ? limits : undefined,
        tags: tags.length > 0 ? tags : undefined,
        campaign: campaign || undefined,
      })
      
      router.push("/links")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-in">
        <Link
          href="/links"
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.08]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gradient">Criar Novo Link</h1>
          <p className="text-muted-foreground mt-1 text-sm">Configure seu link encurtado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Section 1: Basic */}
        <div className="glass-card rounded-xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">Informações Básicas</h2>
              <p className="text-xs text-muted-foreground">URL de destino e código personalizado</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                URL de destino
              </Label>
              <Input
                type="url"
                placeholder="https://exemplo.com/sua-pagina"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocusedField("url")}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  "h-12 bg-white/[0.03] border-white/[0.08] text-base transition-all duration-200",
                  focusedField === "url" && "border-primary/50 bg-white/[0.05] shadow-[0_0_20px_rgba(99,102,241,0.1)]",
                )}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Código personalizado (opcional)
              </Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-mono">sho.rt/</span>
                <Input
                  type="text"
                  placeholder="meu-link"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                  onFocus={() => setFocusedField("code")}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "h-11 bg-white/[0.03] border-white/[0.08] font-mono transition-all duration-200",
                    focusedField === "code" &&
                      "border-primary/50 bg-white/[0.05] shadow-[0_0_20px_rgba(99,102,241,0.1)]",
                  )}
                />
              </div>
              {customCode && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Preview: <span className="text-primary font-mono">sho.rt/{customCode}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Smart Rules */}
        <div className="glass-card rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
          <button
            type="button"
            onClick={() => setRulesOpen(!rulesOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-medium text-foreground">Regras Inteligentes</h2>
                <p className="text-xs text-muted-foreground">
                  {rules.length > 0 ? `${rules.length} regra(s) configurada(s)` : "Redirecione baseado em condições"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                rulesOpen && "rotate-180",
              )}
            />
          </button>

          {rulesOpen && (
            <div className="px-6 pb-6 space-y-4 border-t border-white/[0.06] pt-5">
              {rules.map((rule, index) => (
                <div key={rule.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Regra {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, { field: e.target.value as SmartRule["field"] })}
                      className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground focus:border-primary/50 outline-none transition-colors"
                    >
                      {fieldOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0a0b]">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, { operator: e.target.value as SmartRule["operator"] })}
                      className="h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-foreground focus:border-primary/50 outline-none transition-colors"
                    >
                      {operatorOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0a0a0b]">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <Input
                      placeholder="Valor"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="URL de redirecionamento"
                      value={rule.redirectUrl}
                      onChange={(e) => updateRule(rule.id, { redirectUrl: e.target.value })}
                      className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addRule}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-white/[0.15] text-sm text-muted-foreground hover:text-foreground hover:border-white/[0.25] hover:bg-white/[0.02] transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar regra
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Limits */}
        <div className="glass-card rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
          <button
            type="button"
            onClick={() => setLimitsOpen(!limitsOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-medium text-foreground">Limites</h2>
                <p className="text-xs text-muted-foreground">Defina restrições de cliques e expiração</p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                limitsOpen && "rotate-180",
              )}
            />
          </button>

          {limitsOpen && (
            <div className="px-6 pb-6 space-y-4 border-t border-white/[0.06] pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Máximo de cliques
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ilimitado"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value)}
                    className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Máximo por dia
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ilimitado"
                    value={maxClicksPerDay}
                    onChange={(e) => setMaxClicksPerDay(e.target.value)}
                    className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Data de expiração
                </Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Organization */}
        <div className="glass-card rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
          <button
            type="button"
            onClick={() => setOrgOpen(!orgOpen)}
            className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="text-sm font-medium text-foreground">Organização</h2>
                <p className="text-xs text-muted-foreground">Tags e campanhas para facilitar a busca</p>
              </div>
            </div>
            <ChevronDown
              className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", orgOpen && "rotate-180")}
            />
          </button>

          {orgOpen && (
            <div className="px-6 pb-6 space-y-5 border-t border-white/[0.06] pt-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</Label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-primary/70 transition-colors"
                        >
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
                  className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Campanha</Label>
                <Input
                  placeholder="Ex: Black Friday 2024"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="h-10 bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <Link href="/links">
            <Button
              type="button"
              variant="outline"
              className="border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-11 px-5"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading || !url}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin relative" />
                <span className="relative">Criando...</span>
              </>
            ) : (
              <>
                <span className="relative">Criar Link</span>
                <ArrowRight className="w-4 h-4 relative transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
