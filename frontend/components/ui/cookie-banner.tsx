"use client"

import { useState, useEffect } from "react"
import { Button } from "./button"
import { X, Cookie } from "lucide-react"
import { cn } from "@/lib/utils"

const COOKIE_CONSENT_KEY = "cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: true,
      marketing: false,
      acceptedAt: new Date().toISOString(),
    }))
    setVisible(false)
  }

  const acceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      essential: true,
      analytics: false,
      marketing: false,
      acceptedAt: new Date().toISOString(),
    }))
    setVisible(false)
  }

  if (!mounted || !visible) return null

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-4",
      "animate-in slide-in-from-bottom-4 duration-300"
    )}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#161617] border border-white/[0.08] rounded-xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-10 h-10 rounded-lg bg-primary/10 items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground mb-1">Usamos cookies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Utilizamos cookies essenciais para o funcionamento do site e cookies de análise 
                para melhorar sua experiência. Você pode aceitar todos ou apenas os essenciais.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={acceptAll} size="sm">
                  Aceitar todos
                </Button>
                <Button onClick={acceptEssential} variant="outline" size="sm">
                  Apenas essenciais
                </Button>
              </div>
            </div>
            
            <button
              onClick={acceptEssential}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
