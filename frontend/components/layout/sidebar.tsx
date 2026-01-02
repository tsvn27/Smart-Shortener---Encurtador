"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { LayoutDashboard, Link2, BarChart3, Settings, PlusCircle, LogOut, Menu, X, FileCode2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Configurações", icon: Settings },
]

const API_DOCS_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '/api/docs') || '/api/docs'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const userName = user?.name || "Usuário"
  const userEmail = user?.email || ""
  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase()

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-strong z-50 flex items-center justify-between px-4">
        <Logo size="sm" />
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="hover:bg-white/5">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col transition-transform duration-300 ease-out",
          "bg-[#0a0a0b]/95 backdrop-blur-2xl border-r border-white/[0.06]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* Active indicator background */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl transition-all duration-200",
                    isActive ? "bg-primary/15 border border-primary/20" : "group-hover:bg-white/[0.04]",
                  )}
                />

                {/* Icon with glow when active */}
                <div className="relative z-10">
                  {isActive && <div className="absolute inset-0 bg-primary/40 blur-md rounded-full" />}
                  <item.icon className={cn("w-5 h-5 relative", isActive && "text-primary")} />
                </div>

                <span className="relative z-10">{item.label}</span>

                {/* Active side indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Create link button */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <Link href="/links/new" onClick={() => setMobileOpen(false)}>
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              <PlusCircle className="w-4 h-4 relative" />
              <span className="relative">Novo Link</span>
            </Button>
          </Link>
          <a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-9 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/[0.04]">
            <FileCode2 className="w-3.5 h-3.5" />
            API Docs
          </a>
        </div>

        {/* User section */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer">
            <Avatar className="w-9 h-9 ring-2 ring-white/[0.08]">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={userName} />
              ) : null}
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-white/[0.06] h-8 w-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Bottom nav for mobile - redesigned */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
        <div className="glass-strong rounded-2xl flex items-center justify-around p-2 mx-auto max-w-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 relative",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {isActive && <div className="absolute inset-0 bg-primary/15 rounded-xl" />}
                <item.icon className="w-5 h-5 relative" />
                <span className="text-[10px] font-medium relative">{item.label.slice(0, 6)}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
