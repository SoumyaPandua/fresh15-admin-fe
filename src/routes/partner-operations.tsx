
"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { AlertTriangle, Banknote, CalendarClock, FileWarning, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState, LoadingSkeleton } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  getAdminPartnerOpsOverview,
  getAdminPartnerIncidents,
  getAdminPartnerShifts,
  getAdminPartnerCash,
  resolveAdminPartnerIncident,
  createAdminPartnerIncentive,
} from "@/lib/partner-ops-api";
import { inr } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/partner-operations")({
  head: () => ({
    meta: [
      { title: "Partner Operations — Fresh15 Admin" },
      { name: "description", content: "Monitor delivery partner shifts, incidents, documents and cash reconciliation." },
    ],
  }),
  component: PartnerOperationsPage,
});

function PartnerOperationsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const overview = useQuery({
    queryKey: ["partner-operations", "overview"],
    enabled: Boolean(token),
    queryFn: () => getAdminPartnerOpsOverview(token),
    staleTime: 10_000,
  });

  const incidents = useQuery({
    queryKey: ["partner-operations", "incidents"],
    enabled: Boolean(token),
    queryFn: () => getAdminPartnerIncidents(token),
    staleTime: 10_000,
  });

  const shifts = useQuery({
    queryKey: ["partner-operations", "shifts"],
    enabled: Boolean(token),
    queryFn: () => getAdminPartnerShifts(token),
    staleTime: 10_000,
  });

  const cash = useQuery({
    queryKey: ["partner-operations", "cash"],
    enabled: Boolean(token),
    queryFn: () => getAdminPartnerCash(token),
    staleTime: 10_000,
  });

  const [incentiveTitle, setIncentiveTitle] = useState("");
  const [incentiveAmount, setIncentiveAmount] = useState("500");
  const [incentiveTarget, setIncentiveTarget] = useState("10");
  const [incentiveStart, setIncentiveStart] = useState("");
  const [incentiveEnd, setIncentiveEnd] = useState("");

  const createIncentive = useMutation({
    mutationFn: () => {
      if (!incentiveTitle.trim() || !incentiveStart || !incentiveEnd) {
        throw new Error("Enter incentive title and date range");
      }
      return createAdminPartnerIncentive(token, {
        title: incentiveTitle.trim(),
        amount: Number(incentiveAmount),
        targetDeliveries: Number(incentiveTarget),
        startAt: new Date(incentiveStart).toISOString(),
        endAt: new Date(incentiveEnd).toISOString(),
      });
    },
    onSuccess: () => {
      setIncentiveTitle("");
      setIncentiveAmount("500");
      setIncentiveTarget("10");
      setIncentiveStart("");
      setIncentiveEnd("");
      void qc.invalidateQueries({ queryKey: ["partner-operations", "overview"] });
      toast.success("Incentive published");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create incentive"),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => resolveAdminPartnerIncident(token, id, "RESOLVED", "Reviewed by Fresh15 operations"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["partner-operations", "incidents"] });
      void qc.invalidateQueries({ queryKey: ["partner-operations", "overview"] });
      toast.success("Incident resolved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update incident"),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["partner-operations"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Operations"
        description="Acceptance, shifts, incidents, cash and document readiness."
        actions={<Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />

      {overview.isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : overview.error ? (
        <EmptyState icon={ShieldAlert} title="Couldn't load partner operations" description={(overview.error as Error).message} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Open incidents" value={String(overview.data?.openIncidents ?? 0)} icon={AlertTriangle} tone="warning" />
          <StatCard label="Docs expiring" value={String(overview.data?.expiringDocuments ?? 0)} icon={FileWarning} tone="warning" />
          <StatCard label="Cash collected" value={inr(overview.data?.totalCashCollected ?? 0)} icon={Banknote} />
          <StatCard label="Upcoming shifts" value={String(overview.data?.activeShifts ?? 0)} icon={CalendarClock} tone="info" />
          <StatCard label="Live incentives" value={String(overview.data?.activeIncentives ?? 0)} icon={Sparkles} tone="success" />
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Publish incentive</div>
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input value={incentiveTitle} onChange={(e) => setIncentiveTitle(e.target.value)} placeholder="e.g. Complete 20 deliveries" className="h-10 rounded-xl border bg-background px-3 text-sm" />
            <input value={incentiveAmount} onChange={(e) => setIncentiveAmount(e.target.value)} inputMode="decimal" placeholder="Reward ₹" className="h-10 rounded-xl border bg-background px-3 text-sm" />
            <input value={incentiveTarget} onChange={(e) => setIncentiveTarget(e.target.value)} inputMode="numeric" placeholder="Target deliveries" className="h-10 rounded-xl border bg-background px-3 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="datetime-local" value={incentiveStart} onChange={(e) => setIncentiveStart(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm" />
              <input type="datetime-local" value={incentiveEnd} onChange={(e) => setIncentiveEnd(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm" />
            </div>
          </div>
          <Button className="mt-3" onClick={() => createIncentive.mutate()} disabled={createIncentive.isPending}>
            {createIncentive.isPending ? "Publishing…" : "Publish incentive"}
          </Button>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold">Partner incidents</div>
        {incidents.isLoading ? <LoadingSkeleton rows={4} /> : incidents.error ? <EmptyState icon={AlertTriangle} title="Couldn't load incidents" description={(incidents.error as Error).message} /> : !incidents.data?.length ? (
          <Card className="p-6 text-sm text-muted-foreground">No partner incidents reported.</Card>
        ) : (
          incidents.data.map((x) => (
            <Card key={x._id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{x.type.replaceAll("_", " ")} · {x.severity}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {x.partnerId?.name ?? "Partner"} · {x.orderId?.orderNumber ?? "No order"} · {new Date(x.createdAt).toLocaleString("en-IN")}
                  </div>
                  <div className="mt-3 whitespace-pre-wrap text-sm">{x.description}</div>
                </div>
                {x.status !== "RESOLVED" && (
                  <Button size="sm" variant="outline" onClick={() => resolve.mutate(x._id)} disabled={resolve.isPending}>Resolve</Button>
                )}
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{x.status}</div>
            </Card>
          ))
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Upcoming shifts</div>
          {shifts.isLoading ? <LoadingSkeleton rows={3} /> : shifts.data?.length ? (
            <div className="space-y-2">{shifts.data.slice(0, 10).map((x) => (
              <div key={x._id} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
                <div><div className="font-semibold">{x.partnerId?.name ?? "Partner"}</div><div className="text-xs text-muted-foreground">{new Date(x.startAt).toLocaleString("en-IN")} – {new Date(x.endAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</div></div>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{x.status}</span>
              </div>
            ))}</div>
          ) : <div className="text-sm text-muted-foreground">No shifts scheduled.</div>}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold"><Banknote className="h-4 w-4 text-primary" /> Recent cash activity</div>
          {cash.isLoading ? <LoadingSkeleton rows={3} /> : cash.data?.length ? (
            <div className="space-y-2">{cash.data.slice(0, 10).map((x) => (
              <div key={x._id} className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
                <div><div className="font-semibold">{x.partnerId?.name ?? "Partner"} · {x.type.replaceAll("_", " ")}</div><div className="text-xs text-muted-foreground">{x.orderId?.orderNumber ?? "—"} · {new Date(x.createdAt).toLocaleString("en-IN")}</div></div>
                <span className="font-bold">{inr(Math.abs(x.amount))}</span>
              </div>
            ))}</div>
          ) : <div className="text-sm text-muted-foreground">No cash ledger activity.</div>}
        </Card>
      </section>
    </div>
  );
}
