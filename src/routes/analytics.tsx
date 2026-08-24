"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/ui/card";
import { useAdminAnalytics } from "@/lib/analytics-api";
import { inr, num } from "@/lib/format";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      {
        title: "Analytics — Fresh15 Admin",
      },
      {
        name: "description",
        content:
          "Product, customer and operational analytics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isLoading, error } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Deep insights across customers, revenue and operations."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card
              key={i}
              className="h-[104px] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Deep insights across customers, revenue and operations."
        />

        <Card className="p-5">
          <div className="text-sm font-semibold">
            Unable to load analytics
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Please try again."}
          </div>
        </Card>
      </div>
    );
  }

  const {
    overview,
    revenueSeries,
    weeklyRetention,
    hourlyOrders,
    categoryMix,
  } = data;

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--info)",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep insights across customers, revenue and operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="MRR"
          value={inr(overview.mrr)}
          delta={11.2}
          icon={TrendingUp}
          tone="success"
        />

        <StatCard
          label="New customers"
          value={num(overview.newCustomers)}
          delta={6.4}
          icon={Users}
          tone="info"
        />

        <StatCard
          label="Repeat rate"
          value={`${overview.repeatRate}%`}
          delta={2.1}
          icon={Percent}
          tone="success"
        />

        <StatCard
          label="Orders / customer"
          value={overview.ordersPerCustomer.toFixed(1)}
          delta={1.4}
          icon={ShoppingBag}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 gap-4">
          <div className="text-sm font-semibold">
            Revenue & orders
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient
                    id="a1"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.3}
                    />

                    <stop
                      offset="100%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#a1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div className="text-sm font-semibold">
            Weekly retention
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weeklyRetention}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="week"
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  tickFormatter={(v) => `${v}%`}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v}%`}
                />

                <Line
                  dataKey="rate"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--chart-2)",
                    r: 3,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div className="text-sm font-semibold">
            Orders by hour
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={hourlyOrders}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="hour"
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="orders"
                  fill="var(--chart-3)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div className="text-sm font-semibold">
            Category mix
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryMix}
                  innerRadius={55}
                  outerRadius={95}
                  dataKey="value"
                  paddingAngle={2}
                  stroke="none"
                >
                  {categoryMix.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        colors[
                          i % colors.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total customers"
          value={num(overview.totalCustomers)}
          icon={Users}
        />

        <StatCard
          label="Total orders"
          value={num(overview.totalOrders)}
          icon={ShoppingBag}
        />

        <StatCard
          label="Conversion"
          value={`${overview.conversion}%`}
          delta={0.4}
          icon={Percent}
          tone="success"
        />
      </div>
    </div>
  );
}
