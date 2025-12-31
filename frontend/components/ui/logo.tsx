"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "w-7 h-7", text: "text-base" },
    md: { icon: "w-8 h-8", text: "text-lg" },
    lg: { icon: "w-10 h-10", text: "text-xl" },
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative", sizes[size].icon)}>
        <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full relative">
          <rect width="32" height="32" rx="8" fill="#6366F1" />
          <path
            d="M9 16h6m0 0l-3-3m3 3l-3 3M17 16h6"
            stroke="#FAFAFA"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className={cn("font-semibold text-foreground tracking-tight", sizes[size].text)}>
        Smart<span className="text-primary">.</span>
      </span>
    </div>
  )
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
      <svg viewBox="0 0 32 32" fill="none" className="w-full h-full relative">
        <rect width="32" height="32" rx="8" fill="#6366F1" />
        <path
          d="M9 16h6m0 0l-3-3m3 3l-3 3M17 16h6"
          stroke="#FAFAFA"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
