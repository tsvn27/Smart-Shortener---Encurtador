import { Monitor, Smartphone, Tablet } from "lucide-react"

interface DeviceIconProps {
  device: "desktop" | "mobile" | "tablet"
  className?: string
}

export function DeviceIcon({ device, className = "w-4 h-4" }: DeviceIconProps) {
  const icons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  }

  const Icon = icons[device]
  return <Icon className={className} />
}
