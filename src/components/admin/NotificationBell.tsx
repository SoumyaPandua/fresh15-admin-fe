import { useState } from "react";
import { Bell, CheckCheck, Package, Truck, IndianRupee, Megaphone, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/next-router-compat";
import { toast } from "sonner";
import { relTime } from "@/lib/format";
import {
  useNotifications, useUnreadCount, useNotificationMutations,
  notificationLink, type ApiNotification,
} from "@/lib/notification-api";

function typeVisual(type?: string) {
  switch ((type || "").toUpperCase()) {
    case "ORDER": return { Icon: Package, tone: "text-primary bg-primary/10" };
    case "DELIVERY": return { Icon: Truck, tone: "text-[color:var(--info)] bg-[color:var(--info)]/10" };
    case "PAYMENT": return { Icon: IndianRupee, tone: "text-[color:var(--warning)] bg-[color:var(--warning)]/10" };
    case "PROMOTION": return { Icon: Megaphone, tone: "text-[color:var(--info)] bg-[color:var(--info)]/10" };
    case "SYSTEM": return { Icon: Settings2, tone: "text-muted-foreground bg-muted" };
    default: return { Icon: Bell, tone: "text-primary bg-primary/10" };
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: items = [], isLoading } = useNotifications({ limit: 20 });
  const { data: unread = 0 } = useUnreadCount();
  const { read, readAll } = useNotificationMutations();

  const markAll = () => {
    readAll.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: (e: any) => toast.error(e?.message || "Could not mark notifications as read"),
    });
  };

  const openOne = (n: ApiNotification) => {
    if (!n.isRead) read.mutate(n._id, { onError: (e: any) => toast.error(e?.message || "Could not mark as read") });
  };

  const recent = items.slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-[11px] text-muted-foreground">{unread} unread</div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAll} disabled={unread === 0 || readAll.isPending}>
            {readAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />} Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-[380px]">
          {isLoading ? (
            <div className="space-y-3 p-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Bell className="h-4 w-4" />
              </div>
              <div className="mt-3 text-sm font-medium">You're all caught up</div>
              <div className="mt-0.5 text-xs text-muted-foreground">New notifications will appear here.</div>
            </div>
          ) : (
            <div className="divide-y">
              {recent.map(n => {
                const { Icon, tone } = typeVisual(n.type);
                const to = notificationLink(n);
                const inner = (
                  <div className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1 truncate text-sm font-medium">{n.title || "Notification"}</div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{n.createdAt ? relTime(n.createdAt) : ""}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                    </div>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                );
                return to ? (
                  <Link key={n._id} to={to} onClick={() => { openOne(n); setOpen(false); }} className="block">
                    {inner}
                  </Link>
                ) : (
                  <button key={n._id} onClick={() => openOne(n)} className="block w-full text-left">{inner}</button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Link to="/notifications" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-center text-xs font-medium hover:bg-muted">
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
