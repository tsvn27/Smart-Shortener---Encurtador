"use client"

import { Button } from "./button"
import { AlertTriangle } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-start gap-4">
          {danger && (
            <div className="p-3 rounded-xl bg-rose-500/10">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} className="border-white/[0.08] bg-transparent">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={danger ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
