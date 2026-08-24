"use client";

import { createFileRoute, Link } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { DeliveryStats } from "@/components/admin/DeliveryStats";
import { StatusBadge, orderStatusTone } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminDashboard } from "@/lib/dashboard-api";
import { inr, num, relTime } from "@/lib/format";
import { ShoppingBag, TrendingUp, Users, Truck, Plus, ArrowUpRight, Package, Sparkles } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Fresh15 Admin" }, { name: "description", content: "Fresh15 platform overview: revenue, live orders, customers and partners." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Good morning, Aarav 👋"
          description="Here's what's happening across Fresh15 today."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-[104px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Good morning, Aarav 👋"
          description="Here's what's happening across Fresh15 today."
        />
        <Card className="p-5">
          <div className="text-sm font-semibold">Unable to load dashboard</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </div>
        </Card>
      </div>
    );
  }

  const {
    overview,
    revenueSeries,
    categoryMix,
    hourlyOrders,
    latestOrders,
    topSellingProducts,
  } = data;

  const recent = latestOrders.slice(0, 6);
  const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--info)"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Aarav 👋"
        description="Here's what's happening across Fresh15 today."
        actions={
          <>
            <Button variant="outline" size="sm"><Sparkles className="h-4 w-4" /> AI insights</Button>
            <Button size="sm"><Plus className="h-4 w-4" /> New order</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (30d)" value={inr(overview.totalRevenue)} delta={12.4} icon={TrendingUp} tone="success" hint="vs last month" />
        <StatCard label="Orders (30d)" value={num(overview.totalOrders)} delta={8.1} icon={ShoppingBag} tone="info" hint="vs last month" />
        <StatCard label="Active customers" value={num(overview.activeCustomers)} delta={4.2} icon={Users} tone="default" hint="last 30 days" />
        <StatCard label="Delivery partners online" value={`${overview.activePartners} / ${overview.totalPartners}`} delta={-1.6} icon={Truck} tone="warning" hint="right now" />
      </div>

      <DeliveryStats />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Revenue overview</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5 text-xs">
              {["7d", "30d", "90d"].map((r, i) => (
                <button key={r} className={`rounded-md px-2.5 py-1 font-medium ${i === 1 ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => inr(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div>
            <div className="text-sm font-semibold">Category mix</div>
            <div className="text-xs text-muted-foreground">Revenue share</div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryMix} innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  {categoryMix.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {categoryMix.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="number font-medium">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Recent orders</div>
              <div className="text-xs text-muted-foreground">Latest activity across the platform</div>
            </div>
            <Link to="/orders" className="text-xs font-medium text-primary inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {recent.map((o) => {
              const customer = o.userId;
              const status = mapOrderStatus(o.orderStatus);
              return (
                <Link key={o._id} to="/orders" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={customer?.profileImage || "https://i.pravatar.cc/64?img=15"} className="h-9 w-9 shrink-0 rounded-full" alt="" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{customer?.name || "Customer"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {o.orderNumber || o._id} · {(o.items || []).length} items · {o.createdAt ? relTime(o.createdAt) : "recently"}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="number text-sm font-semibold">{inr(o.grandTotal || 0)}</span>
                    <StatusBadge label={status} tone={orderStatusTone(status)} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div>
            <div className="text-sm font-semibold">Orders by hour</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="orders" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-[color:var(--warning)]/10 p-3">
              <div className="text-muted-foreground">Pending</div>
              <div className="number text-lg font-semibold text-[color:var(--warning)]">{overview.pendingOrders}</div>
            </div>
            <div className="rounded-lg bg-[color:var(--info)]/10 p-3">
              <div className="text-muted-foreground">Live</div>
              <div className="number text-lg font-semibold text-[color:var(--info)]">{overview.liveOrders}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Top selling products</div>
              <div className="text-xs text-muted-foreground">This month</div>
            </div>
            <Link to="/inventory/products" className="text-xs font-medium text-primary inline-flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topSellingProducts.map((p, i) => (
              <div key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="number w-5 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <img src={p.image || "https://picsum.photos/seed/f15-product/80"} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 -ml-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{num(p.sold)} sold · {p.stock} in stock</div>
                </div>
                <span className="number text-sm font-semibold">{inr(p.price)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 gap-4">
          <div>
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs text-muted-foreground">Shortcuts across the platform</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: "/inventory/products", label: "Add product", icon: Package },
              { to: "/marketing/coupons", label: "Create coupon", icon: Sparkles },
              { to: "/notifications", label: "Send notification", icon: TrendingUp },
              { to: "/delivery-partners", label: "Add partner", icon: Truck },
            ].map((q) => (
              <Link key={q.to} to={q.to}
                className="group flex items-center gap-3 rounded-xl border p-3 hover:border-primary/40 hover:bg-primary/5 transition">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary transition">
                  <q.icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium">{q.label}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function mapOrderStatus(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "DELIVERED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "OUT_FOR_DELIVERY":
    case "READY_FOR_PICKUP":
    case "PACKING":
    case "CONFIRMED":
      return "live";
    default:
      return "pending";
  }
}
