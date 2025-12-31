const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1"

interface ApiResponse<T> {
  data: T
  meta?: {
    limit: number
    offset: number
    count: number
  }
}

interface ApiError {
  error: string
}

class ApiClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
    return this.token
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ error: "Request failed" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async getLinks(limit = 20, offset = 0) {
    return this.request<ApiResponse<Link[]>>(`/links?limit=${limit}&offset=${offset}`)
  }

  async getLink(id: string) {
    return this.request<ApiResponse<Link>>(`/links/${id}`)
  }

  async createLink(data: CreateLinkData) {
    return this.request<ApiResponse<Link>>("/links", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateLink(id: string, data: Partial<CreateLinkData>) {
    return this.request<ApiResponse<Link>>(`/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async deleteLink(id: string) {
    return this.request<void>(`/links/${id}`, { method: "DELETE" })
  }

  async pauseLink(id: string) {
    return this.request<ApiResponse<Link>>(`/links/${id}/pause`, { method: "POST" })
  }

  async activateLink(id: string) {
    return this.request<ApiResponse<Link>>(`/links/${id}/activate`, { method: "POST" })
  }

  async getLinkAnalytics(id: string) {
    return this.request<ApiResponse<LinkAnalytics>>(`/links/${id}/analytics`)
  }

  async getLinkClicks(id: string, limit = 20, offset = 0) {
    return this.request<ApiResponse<ClickEvent[]>>(`/links/${id}/clicks?limit=${limit}&offset=${offset}`)
  }

  async login(email: string, password: string) {
    return this.request<ApiResponse<{ token: string; user: User }>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(name: string, email: string, password: string) {
    return this.request<ApiResponse<{ token: string; user: User }>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  async getMe() {
    return this.request<ApiResponse<User>>("/auth/me")
  }

  async getDashboardStats() {
    return this.request<ApiResponse<DashboardStats>>("/stats/dashboard")
  }
}

export const api = new ApiClient()

export interface Link {
  id: string
  shortCode: string
  originalUrl: string
  defaultTargetUrl: string
  ownerId: string
  state: "active" | "paused" | "expired" | "dead" | "viral"
  healthScore: number
  trustScore: number
  rules: RedirectRule[]
  limits: LinkLimits
  tags: string[]
  campaign?: string
  totalClicks: number
  uniqueClicks: number
  clicksToday: number
  lastClickAt?: string
  createdAt: string
  updatedAt: string
}

export interface RedirectRule {
  id: string
  priority: number
  conditions: RuleCondition[]
  targetUrl: string
  active: boolean
}

export interface RuleCondition {
  field: string
  operator: "eq" | "neq" | "in" | "nin" | "gt" | "lt" | "gte" | "lte" | "contains"
  value: string | number | string[]
}

export interface LinkLimits {
  maxClicks?: number
  maxClicksPerDay?: number
  expiresAt?: string
  validFrom?: string
  allowedCountries?: string[]
  blockedCountries?: string[]
}

export interface ClickEvent {
  id: string
  linkId: string
  timestamp: string
  ip: string
  ipHash: string
  userAgent: string
  fingerprint: string
  country?: string
  city?: string
  device: string
  os: string
  browser: string
  language?: string
  referrer?: string
  isBot: boolean
  isSuspicious: boolean
  fraudScore: number
  fraudReasons: string[]
  redirectedTo: string
  ruleApplied?: string
  responseTimeMs: number
}

export interface User {
  id: string
  email: string
  name: string
  plan: "free" | "pro" | "enterprise"
  maxLinks: number
  maxApiKeys: number
  maxWebhooks: number
  createdAt: string
  updatedAt: string
}

export interface CreateLinkData {
  url: string
  customCode?: string
  rules?: RedirectRule[]
  limits?: LinkLimits
  tags?: string[]
  campaign?: string
}

export interface LinkAnalytics {
  totalClicks: number
  uniqueClicks: number
  clicksToday: number
  byCountry: Record<string, number>
  byDevice: Record<string, number>
  byHour: Record<number, number>
  botClicks: number
  suspiciousClicks: number
}

export interface DashboardStats {
  totalLinks: number
  totalClicks: number
  clicksToday: number
  botsBlocked: number
  clicksByDay: { date: string; clicks: number }[]
}
