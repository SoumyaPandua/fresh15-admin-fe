"use client";
import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Fresh15 Admin" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const { requestOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const message = await requestOtp(email);
      toast.success(message);
      navigate({ to: "/auth/verify-otp", search: { email: email.trim() } as any });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a 6-digit verification code.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send OTP
        </Button>
      </form>
      <div className="text-center text-sm">
        <Link to="/auth/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
}
