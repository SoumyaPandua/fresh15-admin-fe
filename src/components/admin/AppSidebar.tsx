import { Link, useRouterState } from "@/lib/next-router-compat";
import {
  LayoutDashboard, TrendingUp, ShoppingBag, Clock, Truck, CheckCircle2, XCircle,
  Users, Bike, Package, Tags, Ticket, Sparkles, Image as ImageIcon,
  Wallet, IndianRupee, RefreshCcw, LifeBuoy, Bell, Store, MapPin, Timer,
  BarChart3, ScrollText, UserCircle2, Leaf, Boxes, Star, BellRing, CalendarClock, Gift
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const groups: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Revenue", url: "/revenue", icon: TrendingUp },
    ],
  },
  {
    label: "Orders",
    items: [
      { title: "All Orders", url: "/orders", icon: ShoppingBag },
      { title: "Pending", url: "/orders/pending", icon: Clock },
      { title: "Live", url: "/orders/live", icon: Truck },
      { title: "Completed", url: "/orders/completed", icon: CheckCircle2 },
      { title: "Cancelled", url: "/orders/cancelled", icon: XCircle },
      { title: "Deliveries", url: "/deliveries", icon: Bike },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Delivery Partners", url: "/delivery-partners", icon: Bike },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Categories", url: "/inventory/categories", icon: Tags },
      { title: "Products", url: "/inventory/products", icon: Package },
      { title: "Stock", url: "/inventory/stock", icon: Boxes },
      { title: "Reviews", url: "/reviews", icon: Star },
      { title: "Product Alerts", url: "/product-alerts", icon: BellRing },
      { title: "Weekly Lists", url: "/weekly-lists", icon: CalendarClock },


    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Coupons", url: "/marketing/coupons", icon: Ticket },
      { title: "Offers", url: "/marketing/offers", icon: Sparkles },
      { title: "Banners", url: "/marketing/banners", icon: ImageIcon },
      { title: "Loyalty & Referrals", url: "/loyalty", icon: Gift },
    ],
  },
  {
    label: "Payments",
    items: [
      { title: "COD Reports", url: "/payments/cod", icon: Wallet },
      { title: "Razorpay Reports", url: "/payments/razorpay", icon: IndianRupee },
      { title: "Refund Center", url: "/payments/refunds", icon: RefreshCcw },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Support Tickets", url: "/support", icon: LifeBuoy },
      { title: "Notifications", url: "/notifications", icon: Bell },
      { title: "Store Settings", url: "/settings/store", icon: Store },
      { title: "Delivery Zones", url: "/settings/zones", icon: MapPin },
      { title: "Time Slots", url: "/settings/slots", icon: Timer },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
      { title: "Admin Profile", url: "/profile", icon: UserCircle2 },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/"));
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold tracking-tight">Fresh15</div>
            <div className="truncate text-[11px] text-muted-foreground">Admin Console</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {g.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.title}>
                      <Link to={it.url}>
                        <it.icon className="h-4 w-4" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <Link to="/profile" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted transition-colors group-data-[collapsible=icon]:hidden">
          <img src={user?.avatar || "https://i.pravatar.cc/64?img=15"} alt="" className="h-8 w-8 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user?.name || "Admin"}</div>
            <div className="truncate text-[11px] text-muted-foreground">{user?.role || "Super Admin"}</div>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
