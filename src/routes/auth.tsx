import { Leaf } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground/15">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Fresh15</div>
            <div className="text-[11px] opacity-80">Admin Console</div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Run your entire fresh-delivery business.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Orders, customers, delivery partners, inventory, payments and insights — the whole platform in one calm, powerful console.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[
              ["12,840", "customers"],
              ["₹42.6L", "monthly GMV"],
              ["15 min", "avg delivery"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-primary-foreground/10 p-3">
                <div className="text-lg font-semibold">{v}</div>
                <div className="text-[11px] opacity-80">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs opacity-70">© 2026 Fresh15. All rights reserved.</div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Fresh15</div>
              <div className="text-[11px] text-muted-foreground">Admin Console</div>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
