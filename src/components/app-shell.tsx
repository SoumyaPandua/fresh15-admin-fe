"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { TopBar } from "@/components/admin/TopBar";
import { useAuth } from "@/lib/auth";
import { Fresh15AiAssistant } from "@/components/common/Fresh15AiAssistant";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const isAuthRoute = pathname.startsWith("/auth");
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready || isAuthRoute) return;
    if (!user) router.replace("/auth/login");
  }, [ready, user, isAuthRoute, router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isAuthRoute) return <>{children}</>;
  if (!user) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Redirecting…</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">{children}</main>
        </SidebarInset>
      </div>
      <Fresh15AiAssistant />
    </SidebarProvider>
  );
}
