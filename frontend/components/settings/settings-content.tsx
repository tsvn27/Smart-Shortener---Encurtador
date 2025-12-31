"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  User,
  Key,
  Webhook,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Upload,
  Monitor,
  Smartphone,
} from "lucide-react"

type Tab = "profile" | "api-keys" | "webhooks" | "security"

interface ApiKey {
  id: string
  name: string
  lastChars: string
  permissions: string[]
  lastUsed: string
  createdAt: string
}

interface WebhookItem {
  id: string
  url: string
  events: string[]
  active: boolean
}

const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "Production Key",
    lastChars: "f4k2",
    permissions: ["read", "write"],
    lastUsed: "2024-01-20T15:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Development Key",
    lastChars: "x9m1",
    permissions: ["read"],
    lastUsed: "2024-01-19T10:00:00Z",
    createdAt: "2024-01-10T00:00:00Z",
  },
]

const mockWebhooks: WebhookItem[] = [
  {
    id: "1",
    url: "https://api.example.com/webhooks/clicks",
    events: ["click", "bot_detected"],
    active: true,
  },
  {
    id: "2",
    url: "https://api.example.com/webhooks/links",
    events: ["link_created", "link_updated"],
    active: false,
  },
]

export function SettingsContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [apiKeys] = useState(mockApiKeys)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [webhooks, setWebhooks] = useState(mockWebhooks)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
    }
  }, [user])

  const tabs = [
    { id: "profile" as Tab, label: "Perfil", icon: User },
    { id: "api-keys" as Tab, label: "API Keys", icon: Key },
    { id: "webhooks" as Tab, label: "Webhooks", icon: Webhook },
    { id: "security" as Tab, label: "Segurança", icon: Shield },
  ]

  const copyApiKey = async (id: string) => {
    await navigator.clipboard.writeText(`sk_live_${id}_full_key_here`)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const toggleWebhook = (id: string) => {
    setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, active: !w.active } : w)))
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-semibold text-gradient">Configurações</h1>
        <p className="text-muted-foreground mt-1 text-sm">Gerencie sua conta e preferências</p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-8 overflow-x-auto border border-white/[0.06] animate-fade-in"
        style={{ animationDelay: "50ms" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="glass-card rounded-xl p-6 space-y-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24 ring-4 ring-white/[0.08]">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-medium">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <Button variant="outline" className="border-white/[0.08] hover:bg-white/[0.04] bg-transparent h-10">
                Alterar foto
              </Button>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG. Máx 2MB</p>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="h-11 bg-white/[0.02] border-white/[0.06] text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano</Label>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 text-sm rounded-lg bg-primary/15 text-primary font-medium capitalize">
                  {user?.plan || "free"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.maxLinks || 10} links máximos
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/[0.06]">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api-keys" && (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Gerencie suas chaves de API para integrar com outros serviços
            </p>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-10">
              <Plus className="w-4 h-4" />
              Nova Key
            </Button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key, index) => (
              <div
                key={key.id}
                className="glass-card rounded-xl p-5 animate-fade-in"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-medium text-foreground">{key.name}</h4>
                      <div className="flex gap-1.5">
                        {key.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 text-[10px] rounded-md bg-primary/15 text-primary font-medium uppercase tracking-wide"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-mono">
                      {revealedKey === key.id ? `sk_live_${key.id}_full_key_here` : `sk_live_****${key.lastChars}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Último uso: {new Date(key.lastUsed).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                      className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                    >
                      {revealedKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyApiKey(key.id)}
                      className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                    >
                      {copiedKey === key.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-2.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === "webhooks" && (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Receba notificações em tempo real sobre eventos dos seus links
            </p>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-10">
              <Plus className="w-4 h-4" />
              Novo Webhook
            </Button>
          </div>

          <div className="space-y-3">
            {webhooks.map((webhook, index) => (
              <div
                key={webhook.id}
                className="glass-card rounded-xl p-5 animate-fade-in"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          webhook.active ? "bg-emerald-500" : "bg-muted-foreground",
                        )}
                      />
                      <p className="text-sm font-mono text-foreground truncate max-w-[400px]">{webhook.url}</p>
                    </div>
                    <div className="flex gap-1.5 mt-2 ml-5">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-white/[0.04] text-muted-foreground border border-white/[0.06]"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={webhook.active} onCheckedChange={() => toggleWebhook(webhook.id)} />
                    <button className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          {/* Change Password */}
          <div className="glass-card rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-medium text-foreground">Alterar Senha</h3>
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Senha atual
                </Label>
                <Input
                  type="password"
                  className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nova senha</Label>
                <Input
                  type="password"
                  className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Confirmar nova senha
                </Label>
                <Input
                  type="password"
                  className="h-11 bg-white/[0.03] border-white/[0.08] focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-10">Alterar senha</Button>
          </div>

          {/* 2FA */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Autenticação em duas etapas</h3>
                <p className="text-xs text-muted-foreground mt-1">Adicione uma camada extra de segurança à sua conta</p>
              </div>
              <Switch checked={twoFAEnabled} onCheckedChange={setTwoFAEnabled} />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="glass-card rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-medium text-foreground">Sessões Ativas</h3>
            <div className="space-y-3">
              {[
                { device: "Chrome em MacOS", location: "São Paulo, BR", current: true, icon: Monitor },
                { device: "Safari em iPhone", location: "São Paulo, BR", current: false, icon: Smartphone },
              ].map((session, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.04]">
                      <session.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground flex items-center gap-2">
                        {session.device}
                        {session.current && (
                          <span className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-500/15 text-emerald-400 font-medium">
                            Atual
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{session.location}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/[0.08] hover:bg-rose-500/10 text-rose-400 bg-transparent h-8"
                    >
                      Encerrar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
