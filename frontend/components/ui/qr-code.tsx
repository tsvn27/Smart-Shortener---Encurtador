"use client"

import { useEffect, useRef, useState } from "react"
import QRCodeLib from "qrcode"
import { cn } from "@/lib/utils"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export function QRCode({ value, size = 180, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    QRCodeLib.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#fafafa",
        light: "#0a0a0b",
      },
      errorCorrectionLevel: "M",
    }).catch(() => setError(true))
  }, [value, size])

  if (error) {
    return (
      <div 
        className={cn("flex items-center justify-center bg-[#0a0a0b] rounded-xl", className)}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-muted-foreground">Erro ao gerar QR</span>
      </div>
    )
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
        <canvas
          ref={canvasRef}
          className="rounded-xl"
          style={{ width: size, height: size }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-lg bg-[#0a0a0b] border border-white/10 flex items-center justify-center shadow-lg">
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
