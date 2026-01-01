import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2 border-white/[0.08] bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
