"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, Camera, KeyRound, Loader2, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  changePassword, getProfile, updateAvatar, updateProfile,
  type ProfileDetails, type ProfileUser,
} from "@/lib/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Admin Profile — Fresh15 Platform Hub" },
      { name: "description", content: "Manage your Fresh15 admin account, avatar, security and notification preferences." },
      { property: "og:title", content: "Admin Profile — Fresh15 Platform Hub" },
      { property: "og:description", content: "Manage your Fresh15 admin account, avatar, security and notification preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const roleLabel = (r?: string) =>
  (r || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "Admin";

const toDateInput = (d?: string) => (d ? String(d).slice(0, 10) : "");

function ProfilePage() {
  const { token, user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [acc, setAcc] = useState<ProfileUser>({});
  const [prof, setProf] = useState<ProfileDetails>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const applyPayload = (u: ProfileUser, p: ProfileDetails) => {
    setAcc(u || {});
    setProf(p || {});
    updateUser({
      name: u?.name ?? undefined,
      email: u?.email ?? undefined,
      phone: u?.phone ?? undefined,
      role: u?.role ?? undefined,
      avatar: u?.profileImage || p?.avatar || undefined,
    });
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    getProfile(token)
      .then((res) => {
        if (cancelled) return;
        applyPayload(res.data?.user || {}, res.data?.profile || {});
        setLoadError(null);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setLoadError(e.message);
        toast.error(e.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const notif = { email: prof.notificationSettings?.email ?? false, push: prof.notificationSettings?.push ?? false };
  const avatar = acc.profileImage || prof.avatar || user?.avatar;
  const initials = (acc.name || user?.name || "A").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const onSave = async () => {
    if (!acc.name?.trim()) return toast.error("Name is required");
    if (!acc.email?.trim()) return toast.error("Email is required");
    setSaving(true);
    try {
      const res = await updateProfile(
        {
          name: acc.name.trim(),
          email: acc.email.trim(),
          phone: (acc.phone || "").trim(),
          gender: prof.gender || undefined,
          dob: toDateInput(prof.dob) || undefined,
          designation: prof.designation || undefined,
          notificationSettings: notif,
        },
        token,
      );
      applyPayload(res.data?.user || {}, res.data?.profile || {});
      toast.success(res.message || "Profile updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await updateAvatar(file, token);
      const img = res.data?.profileImage || res.data?.avatar;
      setAcc((a) => ({ ...a, profileImage: img }));
      setProf((p) => ({ ...p, ...(res.data?.profile || {}), avatar: res.data?.avatar ?? p.avatar }));
      if (img) updateUser({ avatar: img });
      toast.success(res.message || "Avatar updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Profile" description="Your account, security and preferences." />

      {loadError && !loading && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{loadError}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="p-6 gap-4 items-center text-center">
          {loading ? (
            <>
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </>
          ) : (
            <>
              <div className="relative">
                {avatar ? (
                  <img src={avatar} className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/15" alt={acc.name || "Admin avatar"} />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground ring-4 ring-primary/15">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Change avatar"
                  className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border bg-background shadow-sm hover:bg-muted disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0])}
                />
              </div>
              <div>
                <div className="text-lg font-semibold">{acc.name || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {roleLabel(acc.role)}{acc.email ? ` · ${acc.email}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {acc.isEmailVerified ? "Email verified" : "Email unverified"}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {acc.isActive === false ? "Inactive" : "Active"}
                </span>
                {acc.portal && <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{acc.portal}</span>}
              </div>
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5 gap-4">
            <div className="text-sm font-semibold">Account</div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={acc.name || ""} onChange={(e) => setAcc({ ...acc, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={acc.email || ""} onChange={(e) => setAcc({ ...acc, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={acc.phone || ""} onChange={(e) => setAcc({ ...acc, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" value={prof.designation || ""} onChange={(e) => setProf({ ...prof, designation: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={prof.gender || ""} onValueChange={(v) => setProf({ ...prof, gender: v })}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" value={toDateInput(prof.dob)} onChange={(e) => setProf({ ...prof, dob: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Input value={roleLabel(acc.role)} readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Portal</Label>
                  <Input value={acc.portal || "platform"} readOnly disabled />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 gap-3">
            <div className="text-sm font-semibold">Notification preferences</div>
            {[
              { icon: Mail, key: "email" as const, t: "Email notifications", d: "Order, refund and platform alerts by email" },
              { icon: Smartphone, key: "push" as const, t: "Push notifications", d: "Realtime alerts on your devices" },
            ].map(({ icon: Icon, key, t, d }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{t}</div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                </div>
                <Switch
                  checked={notif[key]}
                  disabled={loading}
                  onCheckedChange={(v) =>
                    setProf({ ...prof, notificationSettings: { ...notif, [key]: v } })
                  }
                />
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              <Bell className="h-4 w-4 shrink-0" />
              Preferences are saved together with your profile.
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving || loading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </Button>
          </div>

          <PasswordCard />
        </div>
      </div>
    </div>
  );
}

function PasswordCard() {
  const { token } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return toast.error("Current password is required");
    if (next.length < 6) return toast.error("New password must be at least 6 characters");
    if (next !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const res = await changePassword(current, next, token);
      setCurrent(""); setNext(""); setConfirm("");
      toast.success(res.message || "Password changed successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound className="h-4 w-4" /> Change password
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cur">Current password</Label>
          <Input id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="np">New password</Label>
          <Input id="np" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp">Confirm new password</Label>
          <Input id="cp" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="outline" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
