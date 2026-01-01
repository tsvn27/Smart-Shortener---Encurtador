import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/reset-password-form"

function ResetPasswordContent() {
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] mx-auto mb-4" />
              <div className="h-6 bg-white/[0.05] rounded w-32 mx-auto mb-2" />
              <div className="h-4 bg-white/[0.05] rounded w-48 mx-auto" />
            </div>
          </div>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
