"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { dateTime } from "@/lib/format";
import { useAdminAuditLogs, type ApiAuditLog } from "@/lib/audit-api";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Fresh15 Admin" }, { name: "description", content: "Application audit trail for security, operations and compliance." }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { data, isLoading, error } = useAdminAuditLogs();

  const columns: Column<ApiAuditLog>[] = [
    { key: "when", header: "When", render: (l) => <span className="text-xs text-muted-foreground">{dateTime(l.at)}</span> },
    { key: "actor", header: "Actor", render: (l) => <div><div className="text-sm font-medium">{l.actor}</div><div className="text-[10px] text-muted-foreground">{l.actorRole || "SYSTEM"}</div></div> },
    { key: "action", header: "Action", render: (l) => <span className="text-sm">{l.action}</span> },
    { key: "target", header: "Target", render: (l) => <span className="font-mono text-xs">{l.target}</span> },
    { key: "ip", header: "IP", render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.ip}</span> },
    { key: "location", header: "Location", render: (l) => <span className="text-xs text-muted-foreground">{[l.geo?.city, l.geo?.region, l.geo?.country].filter(Boolean).join(", ") || "—"}</span> },
    { key: "result", header: "Result", render: (l) => <span className={"text-xs font-semibold " + (l.outcome === "FAILURE" ? "text-destructive" : "text-success")}>{l.outcome || "UNKNOWN"}{l.statusCode ? ` · ${l.statusCode}` : ""}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Track important application actions with actor, IP, request and outcome context." />

      <Card className="p-4 text-xs text-muted-foreground">
        IP is captured server-side. Location is optional coarse geolocation from trusted deployment headers when available; Fresh15 does not derive or store exact GPS coordinates for audit records.
      </Card>

      {isLoading ? (
        <Card className="h-96 animate-pulse" />
      ) : error ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">Unable to load audit logs</div>
          <div className="mt-1 text-xs text-muted-foreground">{error instanceof Error ? error.message : "Please try again."}</div>
        </Card>
      ) : (
        <DataTable
          data={data?.items ?? []}
          columns={columns}
          searchable={(l) => `${l.actor} ${l.action} ${l.target} ${l.ip} ${l.path ?? ""} ${l.requestId ?? ""} ${l.geo?.city ?? ""} ${l.geo?.country ?? ""}`}
          pageSize={15}
          bulkActions={false}
        />
      )}
    </div>
  );
}
