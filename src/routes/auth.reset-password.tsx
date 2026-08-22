"use client";
import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Fresh15 Admin" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { resetPassword, resetToken, ready } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetToken) { setError("Your reset session expired. Please request a new code."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const message = await resetPassword(resetToken, password);
      toast.success(message);
      navigate({ to: "/auth/login" });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (ready && !resetToken) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reset session expired</h1>
          <p className="text-sm text-muted-foreground">Please request a new verification code to reset your password.</p>
        </div>
        <Button asChild className="w-full"><Link to="/auth/forgot-password">Request new code</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Reset password
        </Button>
      </form>
      <div className="text-center text-sm">
        <Link to="/auth/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
}
