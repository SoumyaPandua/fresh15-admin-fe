"use client";
import { createFileRoute, Link } from "@/lib/next-router-compat";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Signup unavailable — Fresh15 Admin" }] }),
  component: SignupUnavailablePage,
});

function SignupUnavailablePage() {
  return (
    <div className="space-y-6">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Self sign-up is unavailable</h1>
        <p className="text-sm text-muted-foreground">
          Fresh15 Platform Hub accounts are provisioned directly by the Fresh15 team. Please contact your administrator to have an admin account created for you.
        </p>
      </div>
      <Button asChild className="w-full">
        <Link to="/auth/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
