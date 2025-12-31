"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, Link2, BarChart3, Zap, Globe, MousePointer, Copy, Check } from "lucide-react"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const rotateX = Math.max(0, 12 - scrollY * 0.04)
  const scale = Math.min(1, 0.9 + scrollY * 0.0003)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/login">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="pt-32 pb-8 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className={cn(
              "transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-muted-foreground">+12 milhões de links criados</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4">
                SmartShortener
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                Encurtador de links com analytics completo. 
                Saiba quem clica, de onde e quando.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 group">
                    Começar grátis
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ver demonstração →
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
                <span>✓ Grátis para sempre</span>
                <span>✓ Sem cartão</span>
                <span>✓ Setup em 30s</span>
              </div>
            </div>
          </div>
        </section>

        {/* Browser Window com Screenshot */}
        <section className="px-6 pb-24 pt-8" style={{ perspective: "1500px" }}>
          <div 
            className={cn(
              "max-w-5xl mx-auto transition-all duration-700 relative",
              mounted ? "opacity-100" : "opacity-0 translate-y-12"
            )}
            style={{ 
              transform: `rotateX(${rotateX}deg) scale(${scale})`,
              transformOrigin: "center top"
            }}
          >
            {/* Browser Window */}
            <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c0c0d] shadow-2xl shadow-black/50">
              {/* Browser Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#161617] border-b border-white/[0.06]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0c0c0d] border border-white/[0.06] min-w-[300px]">
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">smartshortener.com/dashboard</span>
                  </div>
                </div>

                <div className="w-[52px]" />
              </div>

              {/* Screenshot */}
              <div className="relative">
                <img 
                  src="/dashboard-screenshot.png" 
                  alt="Dashboard SmartShortener"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="py-24 px-6 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Como funciona</h2>
              <p className="text-muted-foreground">Três passos simples para começar</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              <Step 
                number="1" 
                icon={<Copy className="w-5 h-5" />}
                title="Cole sua URL" 
                desc="Cole qualquer link longo que você quer encurtar"
              />
              <Step 
                number="2" 
                icon={<Zap className="w-5 h-5" />}
                title="Gere o link" 
                desc="Em um clique, seu link curto está pronto"
              />
              <Step 
                number="3" 
                icon={<BarChart3 className="w-5 h-5" />}
                title="Acompanhe" 
                desc="Veja quem clica, de onde e quando em tempo real"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Recursos</h2>
              <p className="text-muted-foreground">Tudo que você precisa para gerenciar seus links</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Feature icon={<Link2 className="w-5 h-5" />} title="Links curtos" desc="URLs fáceis de lembrar e compartilhar" />
              <Feature icon={<BarChart3 className="w-5 h-5" />} title="Analytics" desc="Dados detalhados de cada clique" />
              <Feature icon={<MousePointer className="w-5 h-5" />} title="Tempo real" desc="Acompanhe cliques ao vivo" />
              <Feature icon={<Globe className="w-5 h-5" />} title="Seu domínio" desc="Use seu domínio personalizado" />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 px-6 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-foreground mb-1">12M+</p>
                <p className="text-sm text-muted-foreground">links criados</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-foreground mb-1">847M</p>
                <p className="text-sm text-muted-foreground">cliques rastreados</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-foreground mb-1">99.9%</p>
                <p className="text-sm text-muted-foreground">uptime</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 border-t border-white/[0.04]">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Pronto pra começar?</h2>
            <p className="text-muted-foreground mb-8">Crie sua conta grátis em segundos. Sem cartão de crédito.</p>
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 group">
                Criar conta grátis
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs text-muted-foreground">© 2025 SmartShortener</span>
        </div>
      </footer>
    </div>
  )
}

function Step({ number, icon, title, desc }: { number: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="relative inline-flex mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {number}
        </span>
      </div>
      <h3 className="font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
