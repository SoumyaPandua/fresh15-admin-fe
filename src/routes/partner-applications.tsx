"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuth } from "@/lib/auth";
import { approvePartnerApplication, getPartnerApplications, rejectPartnerApplication } from "@/lib/partner-application-api";
import { toast } from "sonner";

export const Route = createFileRoute("/partner-applications")({
  head: () => ({ meta: [{ title: "Partner Applications — Fresh15 Admin" }] }),
  component: PartnerApplicationsPage,
});

function PartnerApplicationsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["partner-applications", token], enabled: Boolean(token), queryFn: () => getPartnerApplications(token), staleTime: 10_000 });
  const approve = useMutation({ mutationFn: (id: string) => approvePartnerApplication(token, id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ["partner-applications"] }); toast.success("Partner approved"); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Approval failed") });
  const reject = useMutation({ mutationFn: (id: string) => rejectPartnerApplication(token, id, "Application did not meet Fresh15 approval requirements."), onSuccess: () => { void qc.invalidateQueries({ queryKey: ["partner-applications"] }); toast.success("Application rejected"); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Rejection failed") });

  return <div className="space-y-6"><PageHeader title="Partner Applications" description="Review verified delivery partner applications and vehicle registration details." />{query.isLoading ? <Card className="p-6 text-sm text-muted-foreground">Loading applications…</Card> : query.error ? <Card className="p-6 text-sm text-destructive">{(query.error as Error).message}</Card> : !query.data?.length ? <Card className="p-6 text-sm text-muted-foreground">No pending applications.</Card> : <div className="space-y-3">{query.data.map((application) => <Card key={application._id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 font-semibold"><FileCheck2 className="h-4 w-4 text-primary" />{application.userId?.name || "Applicant"}</div><div className="mt-1 text-xs text-muted-foreground">{application.userId?.email} · {application.userId?.phone || "No phone"}</div><div className="mt-3 grid gap-1 text-sm"><span><strong>Vehicle:</strong> {application.vehicleType} · {application.vehicleRegistrationNumber}</span><span><strong>Make / model:</strong> {application.vehicleMakeModel || "Not provided"}</span><span><strong>Email:</strong> {application.userId?.isEmailVerified ? "Verified" : "Not verified"}</span></div></div><div className="flex gap-2"><Button size="sm" onClick={() => approve.mutate(application._id)} disabled={!application.userId?.isEmailVerified || approve.isPending}><CheckCircle2 className="h-4 w-4" /> Approve</Button><Button size="sm" variant="outline" onClick={() => reject.mutate(application._id)} disabled={reject.isPending}><XCircle className="h-4 w-4" /> Reject</Button></div></div></Card>)}</div>}</div>;
}
