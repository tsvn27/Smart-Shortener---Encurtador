"use client"

import { Link2, MousePointer, MousePointerClick, Shield } from "lucide-react"
import { MetricCard } from "@/components/ui/metric-card"
import { mockUser, mockLinks, mockClicks, analyticsData } from "@/lib/mock-data"
import { ClicksChart } from "./clicks-chart"
import { RecentLinks } from "./recent-links"
import { ActivityFeed } from "./activity-feed"

export function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* Header with greeting */}
      <div className="animate-fade-in">
        <p className="text-sm text-muted-foreground mb-1">Bem-vindo de volta,</p>
        <h1 className="text-3xl font-semibold text-gradient">{mockUser.name.split(" ")[0]}</h1>
      </div>

      {/* Metrics Grid - staggered animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Links"
          value={analyticsData.totalLinks}
          icon={<Link2 className="w-4 h-4" />}
          change={12}
          changeLabel="vs. semana"
          delay={0}
        />
        <MetricCard
          title="Cliques Totais"
          value={analyticsData.totalClicks}
          icon={<MousePointer className="w-4 h-4" />}
          sparklineData={analyticsData.clicksByDay.map((d) => d.clicks)}
          change={8}
          changeLabel="vs. semana"
          delay={50}
        />
        <MetricCard
          title="Cliques Hoje"
          value={analyticsData.clicksToday}
          icon={<MousePointerClick className="w-4 h-4" />}
          change={-3}
          changeLabel="vs. ontem"
          delay={100}
        />
        <MetricCard
          title="Bots Bloqueados"
          value={analyticsData.botsBlocked}
          icon={<Shield className="w-4 h-4" />}
          format="number"
          change={analyticsData.botBlockRate}
          changeLabel="do total"
          delay={150}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <ClicksChart data={analyticsData.clicksByDay} />
          <RecentLinks links={mockLinks.slice(0, 5)} />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed clicks={mockClicks} />
        </div>
      </div>
    </div>
  )
}
