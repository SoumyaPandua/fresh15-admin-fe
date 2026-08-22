"use client";
import { createFileRoute, Link } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { relTime, dateTime } from "@/lib/format";
import { Bell, Send, Trash2, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useNotifications, useUnreadCount, useNotificationMutations, notificationLink,
  isNotificationAdmin, NOTIFICATION_TYPES, NOTIFICATION_CHANNELS,
  type ApiNotification, type NotificationType, type NotificationChannel,
} from "@/lib/notification-api";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Fresh15 Admin" },
      { name: "description", content: "Read, manage and send in-app notifications to Fresh15 users." },
      { property: "og:title", content: "Notifications — Fresh15 Admin" },
      { property: "og:description", content: "Read, manage and send in-app notifications to Fresh15 users." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const canSend = isNotificationAdmin(user?.role);
  const { data: list = [], isLoading, isError, error } = useNotifications({ limit: 100 });
  const { data: unread = 0 } = useUnreadCount();
  const { read, readAll, remove, create } = useNotificationMutations();

  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("GENERAL");
  const [channel, setChannel] = useState<NotificationChannel>("IN_APP");
  const [toDelete, setToDelete] = useState<ApiNotification | null>(null);

  const send = () => {
    if (!userId.trim() || !title.trim() || !message.trim()) {
      toast.error("User ID, title and message are required");
      return;
    }
    create.mutate(
      { userId: userId.trim(), title: title.trim(), message: message.trim(), type, channel, metadata: {} },
      {
        onSuccess: () => { toast.success("Notification sent"); setTitle(""); setMessage(""); },
        onError: (e: any) => toast.error(e?.message || "Could not send notification"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Send in-app notifications to a user and review your notification inbox."
        actions={
          <Button
            variant="outline"
            disabled={unread === 0 || readAll.isPending}
            onClick={() => readAll.mutate(undefined, {
              onSuccess: () => toast.success("All notifications marked as read"),
              onError: (e: any) => toast.error(e?.message || "Could not mark notifications as read"),
            })}
          >
            {readAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />} Mark all read
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="p-5 gap-4">
          <div>
            <div className="text-sm font-semibold">Send notification</div>
            <div className="text-xs text-muted-foreground">
              {canSend
                ? "Delivered to a single user by their user ID."
                : "Only Admin and Super Admin accounts can send notifications."}
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="userId">User ID</Label>
              <Input id="userId" placeholder="68b1f0c2e4d1a9f3b2c45678" value={userId} onChange={e => setUserId(e.target.value)} disabled={!canSend} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Order update" value={title} onChange={e => setTitle(e.target.value)} disabled={!canSend} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={3} placeholder="Your order has been updated." value={message} onChange={e => setMessage(e.target.value)} disabled={!canSend} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={v => setType(v as NotificationType)} disabled={!canSend}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={v => setChannel(v as NotificationChannel)} disabled={!canSend}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_CHANNELS.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={send} disabled={!canSend || create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send notification
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Inbox</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>

          {isLoading ? (
            [0, 1, 2].map(i => (
              <Card key={i} className="p-5 gap-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </Card>
            ))
          ) : isError ? (
            <Card className="p-5">
              <EmptyState icon={Bell} title="Could not load notifications" description={(error as Error)?.message || "Please try again."} />
            </Card>
          ) : list.length === 0 ? (
            <Card className="p-5">
              <EmptyState icon={Bell} title="No notifications yet" description="Notifications you receive will appear here." />
            </Card>
          ) : (
            list.map(n => {
              const to = notificationLink(n);
              return (
                <Card key={n._id} className="p-5 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="min-w-0 truncate text-sm font-semibold">{n.title || "Notification"}</div>
                          {!n.isRead && <StatusBadge label="Unread" tone="info" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{n.createdAt ? relTime(n.createdAt) : ""}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setToDelete(n)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {n.type && <StatusBadge label={n.type} tone="neutral" dot={false} />}
                        {n.channel && <StatusBadge label={String(n.channel).replace("_", " ")} tone="neutral" dot={false} />}
                        {n.createdAt && <span className="text-muted-foreground">{dateTime(n.createdAt)}</span>}
                        {!n.isRead && (
                          <button
                            className="font-medium text-primary hover:underline"
                            onClick={() => read.mutate(n._id, { onError: (e: any) => toast.error(e?.message || "Could not mark as read") })}
                          >
                            Mark as read
                          </button>
                        )}
                        {to && (
                          <Link
                            to={to}
                            className="font-medium text-primary hover:underline"
                            onClick={() => { if (!n.isRead) read.mutate(n._id); }}
                          >
                            View details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={v => !v && setToDelete(null)}
        title="Delete notification?"
        description="This will permanently remove the notification."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (toDelete) {
            remove.mutate(toDelete._id, {
              onSuccess: () => toast.success("Notification deleted"),
              onError: (e: any) => toast.error(e?.message || "Could not delete notification"),
            });
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}
