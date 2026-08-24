"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/ui/card";
import { useAdminRevenue } from "@/lib/revenue-api";
import { inr } from "@/lib/format";
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Percent,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      {
        title: "Revenue — Fresh15 Admin",
      },
      {
        name: "description",
        content:
          "Revenue analytics: gross, net, refunds, category mix.",
      },
    ],
  }),
  component: RevenuePage,
});

function RevenuePage() {
  const { data, isLoading, error } = useAdminRevenue();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Revenue"
          description="Track gross, net, refunds and revenue by category."
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
          title="Revenue"
          description="Track gross, net, refunds and revenue by category."
        />

        <Card className="p-5">
          <div className="text-sm font-semibold">
            Unable to load revenue
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
        title="Revenue"
        description="Track gross, net, refunds and revenue by category."
        actions={
          <>
            <Button variant="outline" size="sm">
              Compare period
            </Button>

            <Button size="sm">
              Export report
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={inr(overview.grossRevenue)}
          delta={12.4}
          icon={IndianRupee}
          tone="success"
        />

        <StatCard
          label="Net revenue"
          value={inr(overview.netRevenue)}
          delta={11.6}
          icon={TrendingUp}
          tone="info"
        />

        <StatCard
          label="Refunds"
          value={inr(overview.refunds)}
          delta={-3.1}
          icon={Percent}
          tone="warning"
        />

        <StatCard
          label="AOV"
          value={inr(overview.aov)}
          delta={2.4}
          icon={ShoppingBag}
        />
      </div>

      <Card className="p-5 gap-4">
        <div className="text-sm font-semibold">
          Revenue trend
        </div>

        <div className="h-80">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient
                  id="rev2"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.35}
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
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--muted-foreground)",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  `₹${(v / 1000).toFixed(0)}k`
                }
                width={52}
              />

              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => inr(v)}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#rev2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 gap-4">
          <div className="text-sm font-semibold">
            Category revenue
          </div>

          <div className="h-64">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={categoryMix}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
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

        <Card className="p-5 gap-4">
          <div className="text-sm font-semibold">
            Orders per day
          </div>

          <div className="h-64">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={revenueSeries}>
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
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}