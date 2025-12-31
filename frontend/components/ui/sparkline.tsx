"use client"

import { useId } from "react"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  color?: string
  animated?: boolean
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  className = "",
  color = "#6366F1",
  animated = true,
}: SparklineProps) {
  const id = useId()

  if (!data.length) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const paddedHeight = height - 2
  const paddedWidth = width - 2

  const points = data
    .map((value, index) => {
      const x = 1 + (index / (data.length - 1)) * paddedWidth
      const y = 1 + paddedHeight - ((value - min) / range) * paddedHeight
      return `${x},${y}`
    })
    .join(" ")

  const areaPoints = `1,${height - 1} ${points} ${width - 1},${height - 1}`

  const lastValue = data[data.length - 1]
  const lastX = width - 1
  const lastY = 1 + paddedHeight - ((lastValue - min) / range) * paddedHeight

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sparkline-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <polygon
        points={areaPoints}
        fill={`url(#sparkline-gradient-${id})`}
        className={animated ? "animate-fade-in" : ""}
      />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "animate-fade-in" : ""}
      />

      <circle cx={lastX} cy={lastY} r="2" fill={color} className={animated ? "animate-fade-in" : ""} />
    </svg>
  )
}
