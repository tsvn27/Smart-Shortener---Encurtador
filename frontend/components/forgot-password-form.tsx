"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err: any) {
      setError(err.message || "Erro ao enviar email")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Email enviado!</h1>
          <p className="text-muted-foreground mb-6">
            Se o email existir em nossa base, você receberá um link para redefinir sua senha.
          </p>
          <Link href="/login">
            <Button variant="outline" className="gap-2 border-white/[0.08] bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Esqueceu a senha?</h1>
          <p className="text-muted-foreground mt-2">Digite seu email para receber um link de recuperação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="h-11 bg-white/[0.03] border-white/[0.08]"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
