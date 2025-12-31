"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  const value: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    info: <Info className="w-4 h-4 text-primary" />,
  }

  const styles = {
    success: "border-emerald-500/20 bg-emerald-500/10",
    error: "border-rose-500/20 bg-rose-500/10",
    info: "border-primary/20 bg-primary/10",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg animate-slide-in-right min-w-[280px]",
        styles[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-foreground flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
