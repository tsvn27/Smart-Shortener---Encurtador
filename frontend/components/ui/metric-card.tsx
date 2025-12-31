"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Sparkline } from "./sparkline"
import { useEffect, useState, useRef } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  sparklineData?: number[]
  className?: string
  format?: "number" | "percentage" | "string"
  delay?: number
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  sparklineData,
  className,
  format = "number",
  delay = 0,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const numericValue = typeof value === "number" ? value : 0
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (typeof value !== "number" || !isVisible) return

    const duration = 800
    const steps = 40
    const increment = numericValue / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setDisplayValue(numericValue)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [numericValue, value, isVisible])

  const formattedValue =
    typeof value === "string"
      ? value
      : format === "percentage"
        ? `${displayValue.toFixed(0)}%`
        : displayValue.toLocaleString("pt-BR")

  return (
    <div
      ref={ref}
      className={cn(
        "glass-card rounded-xl p-5 transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-0.5 relative group",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none glow-subtle" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
          {icon && <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold text-foreground tabular-nums">{formattedValue}</p>
            {change !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1.5 mt-2 text-xs font-medium",
                  change >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Math.abs(change)}%</span>
                {changeLabel && <span className="text-muted-foreground font-normal">{changeLabel}</span>}
              </div>
            )}
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="opacity-60 group-hover:opacity-100 transition-opacity">
              <Sparkline data={sparklineData} width={80} height={36} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
