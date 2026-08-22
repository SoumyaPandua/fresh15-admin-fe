"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/ui/card";
import { REVENUE_SERIES, HOURLY_ORDERS, CATEGORY_MIX, CUSTOMERS, ORDERS } from "@/lib/mock-data";
import { inr, num } from "@/lib/format";
import { Users, ShoppingBag, TrendingUp, Percent } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Fresh15 Admin" }, { name: "description", content: "Product, customer and operational analytics." }] }),
  component: () => {
    const colors = ["var(--chart-1)","var(--chart-2)","var(--chart-3)","var(--chart-4)","var(--chart-5)","var(--info)"];
    const retention = Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, rate: Math.round(100 - i * 8 - Math.random() * 4) }));
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Deep insights across customers, revenue and operations." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="MRR" value={inr(1240000)} delta={11.2} icon={TrendingUp} tone="success" />
          <StatCard label="New customers" value={num(482)} delta={6.4} icon={Users} tone="info" />
          <StatCard label="Repeat rate" value="64%" delta={2.1} icon={Percent} tone="success" />
          <StatCard label="Orders / customer" value="4.8" delta={1.4} icon={ShoppingBag} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5 gap-4">
            <div className="text-sm font-semibold">Revenue & orders</div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={REVENUE_SERIES}>
                  <defs>
                    <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#a1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 gap-4">
            <div className="text-sm font-semibold">Weekly retention</div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={retention}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Line dataKey="rate" stroke="var(--chart-2)" strokeWidth={2} dot={{ fill: "var(--chart-2)", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 gap-4">
            <div className="text-sm font-semibold">Orders by hour</div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={HOURLY_ORDERS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="orders" fill="var(--chart-3)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 gap-4">
            <div className="text-sm font-semibold">Category mix</div>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={CATEGORY_MIX} innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={2} stroke="none">
                    {CATEGORY_MIX.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total customers" value={num(CUSTOMERS.length)} icon={Users} />
          <StatCard label="Total orders" value={num(ORDERS.length)} icon={ShoppingBag} />
          <StatCard label="Conversion" value="3.8%" delta={0.4} icon={Percent} tone="success" />
        </div>
      </div>
    );
  },
});
