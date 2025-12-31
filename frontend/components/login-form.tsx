"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Key, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    router.push("/dashboard")
  }

  if (showApiKey) {
    return (
      <div
        className={cn(
          "w-full max-w-[400px] transition-all duration-500",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <div className="glass-strong rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 rounded-2xl glow-subtle pointer-events-none" />

          <div className="relative space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold text-foreground">Autenticação via API</h1>
              <p className="text-sm text-muted-foreground">Cole sua chave de acesso</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  API Key
                </Label>
                <div className="relative group">
                  <Input
                    id="apiKey"
                    type={showPassword ? "text" : "password"}
                    placeholder="sk_live_..."
                    onFocus={() => setFocusedField("apiKey")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "h-12 bg-white/[0.03] border-white/[0.08] font-mono text-sm pr-10 transition-all duration-200",
                      focusedField === "apiKey" &&
                        "border-primary/50 bg-white/[0.05] shadow-[0_0_20px_rgba(99,102,241,0.1)]",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Autenticar
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Back */}
            <button
              onClick={() => setShowApiKey(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar para login com email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-full max-w-[400px] transition-all duration-700 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      )}
    >
      <div className="glass-strong rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-2xl glow-subtle pointer-events-none" />

        <div className="relative space-y-8">
          {/* Logo with animation */}
          <div
            className={cn(
              "flex justify-center transition-all duration-500 delay-100",
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-90",
            )}
          >
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div
            className={cn(
              "text-center space-y-2 transition-all duration-500 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <h1 className="text-2xl font-semibold text-gradient">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">Entre para gerenciar seus links</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={cn(
              "space-y-5 transition-all duration-500 delay-300",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                defaultValue="joao@example.com"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  "h-12 bg-white/[0.03] border-white/[0.08] transition-all duration-200",
                  focusedField === "email" &&
                    "border-primary/50 bg-white/[0.05] shadow-[0_0_20px_rgba(99,102,241,0.1)]",
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Senha
                </Label>
                <button type="button" className="text-xs text-primary/80 hover:text-primary transition-colors">
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  defaultValue="password123"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "h-12 bg-white/[0.03] border-white/[0.08] pr-10 transition-all duration-200",
                    focusedField === "password" &&
                      "border-primary/50 bg-white/[0.05] shadow-[0_0_20px_rgba(99,102,241,0.1)]",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </Button>
          </form>

          {/* Divider */}
          <div className={cn("relative transition-all duration-500 delay-400", mounted ? "opacity-100" : "opacity-0")}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0a0a0b] px-3 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          {/* API Key login */}
          <button
            onClick={() => setShowApiKey(true)}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-white/[0.08] text-sm text-muted-foreground hover:text-foreground hover:border-white/[0.15] hover:bg-white/[0.02] transition-all duration-200",
              mounted ? "opacity-100 translate-y-0 delay-500" : "opacity-0 translate-y-4",
            )}
          >
            <Key className="w-4 h-4" />
            API Key
          </button>

          {/* Sign up */}
          <p
            className={cn(
              "text-center text-sm text-muted-foreground transition-all duration-500 delay-[600ms]",
              mounted ? "opacity-100" : "opacity-0",
            )}
          >
            Não tem conta?{" "}
            <button className="text-primary hover:text-primary/80 font-medium transition-colors">
              Criar conta grátis
            </button>
          </p>
        </div>
      </div>

      {/* Footer badge */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground/60 transition-all duration-500 delay-700",
          mounted ? "opacity-100" : "opacity-0",
        )}
      >
        <Sparkles className="w-3 h-3" />
        <span>Powered by Smart Shortener</span>
      </div>
    </div>
  )
}
