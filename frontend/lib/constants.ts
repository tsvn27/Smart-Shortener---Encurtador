export const SHORT_DOMAIN = process.env.NEXT_PUBLIC_SHORT_DOMAIN || "localhost:3002"

export function getShortUrl(shortCode: string): string {
  const protocol = SHORT_DOMAIN.includes("localhost") ? "http" : "https"
  return `${protocol}://${SHORT_DOMAIN}/${shortCode}`
}
