"use client";

import { Suspense } from "react";
import { Route } from "@/routes/auth.verify-otp";

const Component = Route.options.component;

export default function Page() {
  return (
    <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">Loading…</div>}>
      <Component />
    </Suspense>
  );
}
