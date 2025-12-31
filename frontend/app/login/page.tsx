"use client"

import { LoginForm } from "@/components/login-form"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 -z-10">
        {/* Main gradient orb - animated */}
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-all duration-1000 ease-out ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Secondary orb */}
        <div
          className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full transition-all duration-1000 delay-200 ease-out ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />

        {/* Grid pattern - refined */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 delay-300 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `
              linear-gradient(rgba(250, 250, 250, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(250, 250, 250, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          }}
        />

        {/* Subtle radial gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 0%, transparent 0%, #0a0a0b 70%)",
          }}
        />
      </div>

      <LoginForm />
    </div>
  )
}
