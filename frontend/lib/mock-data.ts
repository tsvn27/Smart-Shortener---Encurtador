export interface Link {
  id: string
  shortCode: string
  originalUrl: string
  clicks: number
  uniqueClicks: number
  clicksToday: number
  status: "active" | "paused" | "expired"
  health: number
  createdAt: string
  expiresAt?: string
  tags: string[]
  campaign?: string
  clicksHistory: number[]
  rules: SmartRule[]
  limits: LinkLimits
}

export interface SmartRule {
  id: string
  field: "country" | "device" | "language" | "time"
  operator: "=" | "!=" | "contains"
  value: string
  redirectUrl: string
}

export interface LinkLimits {
  maxClicks?: number
  maxClicksPerDay?: number
  expiresAt?: string
  allowedCountries?: string[]
  blockedCountries?: string[]
}

export interface ClickEvent {
  id: string
  linkId: string
  timestamp: string
  country: string
  countryCode: string
  device: "desktop" | "mobile" | "tablet"
  referrer: string
  status: "legitimate" | "bot" | "suspicious"
  ip?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export const mockUser: User = {
  id: "1",
  name: "João Silva",
  email: "joao@example.com",
  avatar: "/professional-man-avatar.png",
}

export const mockLinks: Link[] = [
  {
    id: "1",
    shortCode: "promo2024",
    originalUrl: "https://example.com/promocao-black-friday-2024-ofertas-incriveis",
    clicks: 1247,
    uniqueClicks: 892,
    clicksToday: 156,
    status: "active",
    health: 95,
    createdAt: "2024-01-15T10:00:00Z",
    tags: ["marketing", "black-friday"],
    campaign: "Black Friday 2024",
    clicksHistory: [89, 120, 156, 201, 178, 190, 156],
    rules: [{ id: "1", field: "country", operator: "=", value: "BR", redirectUrl: "https://example.com/br" }],
    limits: { maxClicks: 5000 },
  },
  {
    id: "2",
    shortCode: "app-dl",
    originalUrl: "https://apps.apple.com/app/example-app",
    clicks: 523,
    uniqueClicks: 412,
    clicksToday: 45,
    status: "active",
    health: 88,
    createdAt: "2024-01-10T14:30:00Z",
    tags: ["app", "download"],
    campaign: "App Launch",
    clicksHistory: [34, 45, 67, 89, 56, 78, 45],
    rules: [
      { id: "2", field: "device", operator: "=", value: "mobile", redirectUrl: "https://apps.apple.com/app/example" },
    ],
    limits: {},
  },
  {
    id: "3",
    shortCode: "webinar",
    originalUrl: "https://example.com/webinar-ia-2024",
    clicks: 89,
    uniqueClicks: 78,
    clicksToday: 12,
    status: "paused",
    health: 72,
    createdAt: "2024-01-05T09:00:00Z",
    tags: ["webinar", "ia"],
    clicksHistory: [23, 34, 12, 8, 5, 4, 3],
    rules: [],
    limits: { maxClicks: 100, expiresAt: "2024-02-01T00:00:00Z" },
  },
  {
    id: "4",
    shortCode: "viral-post",
    originalUrl: "https://example.com/artigo-viral-tendencias",
    clicks: 8934,
    uniqueClicks: 6721,
    clicksToday: 1203,
    status: "active",
    health: 98,
    createdAt: "2024-01-01T00:00:00Z",
    tags: ["viral", "tendencias"],
    campaign: "Content Marketing",
    clicksHistory: [567, 890, 1102, 1456, 1234, 1098, 1203],
    rules: [],
    limits: {},
  },
  {
    id: "5",
    shortCode: "ebook",
    originalUrl: "https://example.com/download-ebook-gratuito",
    clicks: 234,
    uniqueClicks: 198,
    clicksToday: 8,
    status: "active",
    health: 45,
    createdAt: "2024-01-12T16:00:00Z",
    tags: ["ebook", "lead"],
    clicksHistory: [45, 34, 23, 18, 12, 10, 8],
    rules: [],
    limits: { maxClicks: 500 },
  },
]

export const mockClicks: ClickEvent[] = [
  {
    id: "1",
    linkId: "1",
    timestamp: "2024-01-20T15:32:00Z",
    country: "Brasil",
    countryCode: "BR",
    device: "mobile",
    referrer: "instagram.com",
    status: "legitimate",
  },
  {
    id: "2",
    linkId: "1",
    timestamp: "2024-01-20T15:30:00Z",
    country: "Portugal",
    countryCode: "PT",
    device: "desktop",
    referrer: "google.com",
    status: "legitimate",
  },
  {
    id: "3",
    linkId: "4",
    timestamp: "2024-01-20T15:28:00Z",
    country: "Estados Unidos",
    countryCode: "US",
    device: "mobile",
    referrer: "twitter.com",
    status: "legitimate",
  },
  {
    id: "4",
    linkId: "1",
    timestamp: "2024-01-20T15:25:00Z",
    country: "Brasil",
    countryCode: "BR",
    device: "tablet",
    referrer: "facebook.com",
    status: "suspicious",
  },
  {
    id: "5",
    linkId: "2",
    timestamp: "2024-01-20T15:20:00Z",
    country: "México",
    countryCode: "MX",
    device: "mobile",
    referrer: "direct",
    status: "legitimate",
  },
  {
    id: "6",
    linkId: "4",
    timestamp: "2024-01-20T15:18:00Z",
    country: "Alemanha",
    countryCode: "DE",
    device: "desktop",
    referrer: "linkedin.com",
    status: "legitimate",
  },
  {
    id: "7",
    linkId: "1",
    timestamp: "2024-01-20T15:15:00Z",
    country: "Brasil",
    countryCode: "BR",
    device: "desktop",
    referrer: "unknown",
    status: "bot",
  },
]

export const analyticsData = {
  totalLinks: 23,
  totalClicks: 15847,
  clicksToday: 1432,
  botsBlocked: 234,
  botBlockRate: 14.8,
  clicksByDay: [
    { date: "14 Jan", clicks: 1234 },
    { date: "15 Jan", clicks: 1567 },
    { date: "16 Jan", clicks: 1890 },
    { date: "17 Jan", clicks: 2134 },
    { date: "18 Jan", clicks: 1987 },
    { date: "19 Jan", clicks: 2345 },
    { date: "20 Jan", clicks: 1432 },
  ],
  deviceDistribution: [
    { name: "Mobile", value: 58, fill: "#6366F1" },
    { name: "Desktop", value: 35, fill: "#818CF8" },
    { name: "Tablet", value: 7, fill: "#A5B4FC" },
  ],
  topCountries: [
    { country: "Brasil", code: "BR", clicks: 8934, percentage: 56 },
    { country: "Estados Unidos", code: "US", clicks: 3421, percentage: 22 },
    { country: "Portugal", code: "PT", clicks: 1567, percentage: 10 },
    { country: "México", code: "MX", clicks: 987, percentage: 6 },
    { country: "Argentina", code: "AR", clicks: 534, percentage: 3 },
  ],
  clicksByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    clicks: Math.floor(Math.random() * 100) + 20,
  })),
}
