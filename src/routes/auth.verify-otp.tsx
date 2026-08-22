"use client";
import { createFileRoute, Link, useNavigate } from "@/lib/next-router-compat";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth/verify-otp")({
  head: () => ({ meta: [{ title: "Verify OTP — Fresh15 Admin" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ email: (s.email as string) ?? "" }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { verifyOtp, requestOtp, resetEmail } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch() as { email?: string };
  const email = search.email || resetEmail || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success("OTP verified successfully");
      navigate({ to: "/auth/reset-password" });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setResending(true);
    try {
      const message = await requestOtp(email);
      toast.success(message);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Verification expired</h1>
          <p className="text-sm text-muted-foreground">Please request a new verification code.</p>
        </div>
        <Button asChild className="w-full"><Link to="/auth/forgot-password">Request new code</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <MailCheck className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="otp">Verification code</Label>
          <InputOTP id="otp" maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Verify code
        </Button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Didn't get the code?{" "}
        <button type="button" onClick={onResend} disabled={resending} className="font-medium text-primary hover:underline disabled:opacity-60">
          {resending ? "Sending…" : "Resend"}
        </button>
      </div>
      <div className="text-center text-sm">
        <Link to="/auth/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
}
