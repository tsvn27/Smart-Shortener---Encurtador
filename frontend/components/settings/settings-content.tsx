"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type ApiKeyItem, type WebhookItem } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  Camera,
  Monitor,
  Lock,
  Bell,
  Code2,
  Webhook,
  User,
  ShieldCheck,
  Fingerprint,
  LogOut,
  Send,
  Zap,
  ChevronRight,
  X,
} from "lucide-react"

type Tab = "account" | "security" | "notifications" | "api" | "webhooks"

export function SettingsContent() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const { success, error: showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<Tab>("account")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [name, setName] = useState("")
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [loadingWebhooks, setLoadingWebhooks] = useState(true)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [twoFASecret, setTwoFASecret] = useState("")
  const [twoFAQRCode, setTwoFAQRCode] = useState("")
  const [twoFACode, setTwoFACode] = useState("")
  const [loading2FA, setLoading2FA] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setTwoFAEnabled(user.twoFAEnabled || false)
    }
  }, [user])

  useEffect(() => {
    if (activeTab === "api") {
      loadApiKeys()
    } else if (activeTab === "webhooks") {
      loadWebhooks()
    }
  }, [activeTab])

  const loadApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await api.getApiKeys()
      setApiKeys(res.data)
    } catch (err) {
      console.error("Failed to load API keys:", err)
    } finally {
      setLoadingKeys(false)
    }
  }

  const loadWebhooks = async () => {
    setLoadingWebhooks(true)
    try {
      const res = await api.getWebhooks()
      setWebhooks(res.data)
    } catch (err) {
      console.error("Failed to load webhooks:", err)
    } finally {
      setLoadingWebhooks(false)
    }
  }

  const tabs = [
    { id: "account" as Tab, label: "Conta", icon: User },
    { id: "security" as Tab, label: "Segurança", icon: ShieldCheck },
    { id: "notifications" as Tab, label: "Alertas", icon: Bell },
    { id: "api" as Tab, label: "API", icon: Code2 },
    { id: "webhooks" as Tab, label: "Webhooks", icon: Webhook },
  ]

  const copyApiKey = async (id: string, key?: string) => {
    await navigator.clipboard.writeText(key || `sk_live_****${id.slice(-4)}`)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSave = async () => {
    if (!name.trim() || name === user?.name) return
    setIsLoading(true)
    try {
      await api.updateProfile(name)
      await refreshUser?.()
      success("Perfil atualizado!")
    } catch (err) {
      showError("Erro ao atualizar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError("Selecione uma imagem válida")
      return
    }

    if (file.size > 500000) {
      showError("Imagem muito grande (máx 500KB)")
      return
    }

    setUploadingAvatar(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        try {
          await api.uploadAvatar(base64)
          await refreshUser?.()
          success("Foto atualizada!")
        } catch (err) {
          showError("Erro ao atualizar foto")
        } finally {
          setUploadingAvatar(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      showError("Erro ao processar imagem")
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true)
    try {
      await api.deleteAvatar()
      await refreshUser?.()
      success("Foto removida!")
    } catch (err) {
      showError("Erro ao remover foto")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showError("As senhas não coincidem")
      return
    }
    if (newPassword.length < 6) {
      showError("A nova senha deve ter pelo menos 6 caracteres")
      return
    }
    
    setChangingPassword(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      success("Senha alterada com sucesso!")
      setShowPasswordModal(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      showError(err.message || "Erro ao alterar senha")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      await api.deleteAccount()
      logout()
      router.push("/login")
    } catch (err) {
      showError("Erro ao excluir conta")
    } finally {
      setDeletingAccount(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) return
    try {
      const res = await api.createApiKey(newKeyName, ["links:read", "links:write"])
      setApiKeys([...apiKeys, res.data])
      setNewKeyName("")
      success("Chave criada! Copie agora, ela não será mostrada novamente.")
      await navigator.clipboard.writeText(res.data.key)
    } catch (err) {
      showError("Erro ao criar chave de API")
    }
  }

  const deleteApiKey = async (id: string) => {
    try {
      await api.deleteApiKey(id)
      setApiKeys(apiKeys.filter(k => k.id !== id))
      success("Chave excluída!")
    } catch (err) {
      showError("Erro ao excluir chave")
    }
  }

  const createWebhook = async () => {
    if (!newWebhookUrl.trim()) return
    try {
      const res = await api.createWebhook(newWebhookUrl, ["click", "link_created"])
      setWebhooks([...webhooks, res.data])
      setNewWebhookUrl("")
      success("Webhook criado!")
    } catch (err) {
      showError("Erro ao criar webhook")
    }
  }

  const toggleWebhook = async (id: string, active: boolean) => {
    try {
      await api.updateWebhook(id, active)
      setWebhooks(webhooks.map(w => w.id === id ? { ...w, active } : w))
      success(active ? "Webhook ativado!" : "Webhook desativado!")
    } catch (err) {
      showError("Erro ao atualizar webhook")
    }
  }

  const deleteWebhook = async (id: string) => {
    try {
      await api.deleteWebhook(id)
      setWebhooks(webhooks.filter(w => w.id !== id))
      success("Webhook excluído!")
    } catch (err) {
      showError("Erro ao excluir webhook")
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    if (enabled) {
      // Start 2FA setup
      setLoading2FA(true)
      try {
        const res = await api.setup2FA()
        setTwoFASecret(res.data.secret)
        setTwoFAQRCode(res.data.qrCode)
        setShow2FASetup(true)
      } catch (err: any) {
        showError(err.message || "Erro ao configurar 2FA")
      } finally {
        setLoading2FA(false)
      }
    } else {
      // Show disable modal
      setShow2FADisable(true)
    }
  }

  const verify2FA = async () => {
    if (twoFACode.length !== 6) return
    setLoading2FA(true)
    try {
      await api.verify2FA(twoFACode)
      setTwoFAEnabled(true)
      setShow2FASetup(false)
      setTwoFACode("")
      setTwoFASecret("")
      setTwoFAQRCode("")
      await refreshUser?.()
      success("2FA ativado com sucesso!")
    } catch (err: any) {
      showError(err.message || "Código inválido")
    } finally {
      setLoading2FA(false)
    }
  }

  const disable2FA = async () => {
    if (twoFACode.length !== 6) return
    setLoading2FA(true)
    try {
      await api.disable2FA(twoFACode)
      setTwoFAEnabled(false)
      setShow2FADisable(false)
      setTwoFACode("")
      await refreshUser?.()
      success("2FA desativado com sucesso!")
    } catch (err: any) {
      showError(err.message || "Código inválido")
    } finally {
      setLoading2FA(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-semibold text-gradient">Configurações</h1>
        <p className="text-muted-foreground mt-1 text-sm">Gerencie sua conta e preferências</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1 animate-fade-in" style={{ animationDelay: "50ms" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
            
            <div className="pt-4 mt-4 border-t border-white/[0.06]">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === "account" && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="w-20 h-20 ring-2 ring-white/[0.08]">
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">
                        {user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button 
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.12] transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 text-foreground animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </button>
                    {user?.avatar && (
                      <button 
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3 h-3 text-rose-400" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Clique na câmera para alterar a foto</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-medium text-foreground">Informações</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-white/[0.03] border-white/[0.08]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input value={user?.email || ""} disabled className="h-10 bg-white/[0.02] border-white/[0.06] text-muted-foreground" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={isLoading} size="sm" className="gap-2">
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card rounded-xl divide-y divide-white/[0.06]">
                <SettingRow 
                  icon={<Lock className="w-4 h-4" />} 
                  title="Alterar senha" 
                  description="Mantenha sua conta segura" 
                  action={<ChevronRight className="w-4 h-4 text-muted-foreground" />} 
                  onClick={() => setShowPasswordModal(true)}
                  clickable 
                />
                <SettingRow 
                  icon={<Fingerprint className="w-4 h-4" />} 
                  title="Autenticação 2FA" 
                  description={twoFAEnabled ? "Ativado - Protegido com autenticador" : "Desativado"} 
                  action={
                    loading2FA ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Switch checked={twoFAEnabled} onCheckedChange={handle2FAToggle} />
                    )
                  } 
                />
              </div>

              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Sessões ativas</h3>
                <div className="space-y-3">
                  <SessionRow device="Chrome em Windows" location="São Paulo, BR" current icon={Monitor} />
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 border-rose-500/20">
                <h3 className="text-sm font-medium text-rose-400 mb-2">Zona de perigo</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Ao excluir sua conta, todos os seus links, analytics e dados serão permanentemente removidos.
                </p>
                <Button 
                  variant="outline" 
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                  onClick={() => setShowDeleteAccountModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir minha conta
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="animate-fade-in">
              <div className="glass-card rounded-xl divide-y divide-white/[0.06]">
                <SettingRow icon={<Send className="w-4 h-4" />} title="Alertas por email" description="Receba notificações sobre seus links" action={<Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />} />
                <SettingRow icon={<Zap className="w-4 h-4" />} title="Relatório semanal" description="Resumo de performance toda segunda" action={<Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />} />
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <Input 
                  value={newKeyName} 
                  onChange={(e) => setNewKeyName(e.target.value)} 
                  placeholder="Nome da chave"
                  className="h-9 bg-white/[0.03] border-white/[0.08] flex-1"
                />
                <Button size="sm" className="gap-1.5 h-9" onClick={createApiKey} disabled={!newKeyName.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                  Criar
                </Button>
              </div>
              
              {loadingKeys ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Code2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma chave de API criada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <ApiKeyCard
                      key={key.id}
                      apiKey={key}
                      revealed={revealedKey === key.id}
                      copied={copiedKey === key.id}
                      onReveal={() => setRevealedKey(revealedKey === key.id ? null : key.id)}
                      onCopy={() => copyApiKey(key.id)}
                      onDelete={() => deleteApiKey(key.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "webhooks" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <Input 
                  value={newWebhookUrl} 
                  onChange={(e) => setNewWebhookUrl(e.target.value)} 
                  placeholder="https://seu-servidor.com/webhook"
                  className="h-9 bg-white/[0.03] border-white/[0.08] flex-1"
                />
                <Button size="sm" className="gap-1.5 h-9" onClick={createWebhook} disabled={!newWebhookUrl.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                  Criar
                </Button>
              </div>
              
              {loadingWebhooks ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : webhooks.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Webhook className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum webhook configurado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((webhook) => (
                    <WebhookCard
                      key={webhook.id}
                      webhook={webhook}
                      onToggle={() => toggleWebhook(webhook.id, !webhook.active)}
                      onDelete={() => deleteWebhook(webhook.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Alterar senha</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Senha atual</Label>
                <Input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="h-10 bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nova senha</Label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="h-10 bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Confirmar nova senha</Label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="h-10 bg-white/[0.03] border-white/[0.08]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="border-white/[0.08] bg-transparent">
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Alterar senha
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      <ConfirmModal
        open={showDeleteAccountModal}
        title="Excluir conta"
        description="Tem certeza que deseja excluir sua conta? Todos os seus links, analytics e dados serão permanentemente removidos. Esta ação não pode ser desfeita."
        confirmText={deletingAccount ? "Excluindo..." : "Excluir minha conta"}
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccountModal(false)}
      />

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShow2FASetup(false); setTwoFACode(""); }} />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-foreground mb-2">Configurar 2FA</h3>
            <p className="text-sm text-muted-foreground mb-6">Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc.)</p>
            
            <div className="flex justify-center mb-6">
              {twoFAQRCode && (
                <img src={twoFAQRCode} alt="QR Code 2FA" className="w-48 h-48 rounded-lg" />
              )}
            </div>
            
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">Ou digite o código manualmente:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 rounded bg-white/[0.05] text-xs font-mono text-foreground break-all">{twoFASecret}</code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(twoFASecret); success("Código copiado!"); }}
                  className="border-white/[0.08] bg-transparent"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Digite o código do app para confirmar</Label>
                <Input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  className="h-12 bg-white/[0.03] border-white/[0.08] text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShow2FASetup(false); setTwoFACode(""); }} className="border-white/[0.08] bg-transparent">
                Cancelar
              </Button>
              <Button onClick={verify2FA} disabled={loading2FA || twoFACode.length !== 6}>
                {loading2FA ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Ativar 2FA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {show2FADisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShow2FADisable(false); setTwoFACode(""); }} />
          <div className="relative glass-card rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-foreground mb-2">Desativar 2FA</h3>
            <p className="text-sm text-muted-foreground mb-6">Digite o código do seu app autenticador para confirmar a desativação.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Código 2FA</Label>
                <Input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  className="h-12 bg-white/[0.03] border-white/[0.08] text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShow2FADisable(false); setTwoFACode(""); }} className="border-white/[0.08] bg-transparent">
                Cancelar
              </Button>
              <Button 
                onClick={disable2FA} 
                disabled={loading2FA || twoFACode.length !== 6}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {loading2FA ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Desativar 2FA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingRow({ icon, title, description, action, clickable, onClick }: { icon: React.ReactNode; title: string; description: string; action: React.ReactNode; clickable?: boolean; onClick?: () => void }) {
  const Comp = clickable ? "button" : "div"
  return (
    <Comp className={cn("w-full flex items-center justify-between p-4", clickable && "hover:bg-white/[0.02] transition-colors text-left")} onClick={onClick}>
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-lg bg-white/[0.04] text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </Comp>
  )
}

function SessionRow({ device, location, current, icon: Icon }: { device: string; location: string; current?: boolean; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <div>
          <p className="text-sm text-foreground flex items-center gap-2">
            {device}
            {current && <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/15 text-emerald-400">atual</span>}
          </p>
          <p className="text-xs text-muted-foreground">{location}</p>
        </div>
      </div>
      {!current && (
        <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 text-xs">Encerrar</Button>
      )}
    </div>
  )
}

function ApiKeyCard({ apiKey, revealed, copied, onReveal, onCopy, onDelete }: { apiKey: ApiKeyItem; revealed: boolean; copied: boolean; onReveal: () => void; onCopy: () => void; onDelete: () => void }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{apiKey.name}</span>
            {apiKey.permissions.map((p) => (
              <span key={p} className="px-1.5 py-0.5 text-[10px] rounded bg-primary/15 text-primary uppercase">{p.split(':')[1]}</span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            sk_live_••••{apiKey.lastChars}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onCopy} icon={copied ? Check : Copy} success={copied} />
          <IconBtn onClick={onDelete} icon={Trash2} danger />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        {apiKey.lastUsed ? `Usado: ${new Date(apiKey.lastUsed).toLocaleDateString("pt-BR")}` : "Nunca usado"}
      </p>
    </div>
  )
}

function WebhookCard({ webhook, onToggle, onDelete }: { webhook: WebhookItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", webhook.active ? "bg-emerald-500" : "bg-zinc-500")} />
          <p className="text-sm font-mono text-foreground truncate">{webhook.url}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <Switch checked={webhook.active} onCheckedChange={onToggle} />
          <IconBtn onClick={onDelete} icon={Trash2} danger />
        </div>
      </div>
      <div className="flex gap-1.5 mt-3 ml-5">
        {webhook.events.map((e) => (
          <span key={e} className="px-2 py-0.5 text-[10px] rounded bg-white/[0.04] text-muted-foreground">{e}</span>
        ))}
      </div>
    </div>
  )
}

function IconBtn({ icon: Icon, onClick, danger, success }: { icon: React.ElementType; onClick?: () => void; danger?: boolean; success?: boolean }) {
  return (
    <button onClick={onClick} className={cn("p-2 rounded-lg transition-colors", danger ? "text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10" : success ? "text-emerald-400" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]")}>
      <Icon className="w-4 h-4" />
    </button>
  )
}
