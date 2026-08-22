"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { AUDIT_LOGS, type AuditLog } from "@/lib/mock-data";
import { dateTime } from "@/lib/format";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Fresh15 Admin" }, { name: "description", content: "Immutable log of every admin action." }] }),
  component: () => {
    const columns: Column<AuditLog>[] = [
      { key: "when", header: "When", render: (l) => <span className="text-xs text-muted-foreground">{dateTime(l.at)}</span> },
      { key: "actor", header: "Actor", render: (l) => <span className="text-sm font-medium">{l.actor}</span> },
      { key: "action", header: "Action", render: (l) => <span className="text-sm">{l.action}</span> },
      { key: "target", header: "Target", render: (l) => <span className="font-mono text-xs">{l.target}</span> },
      { key: "ip", header: "IP", render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.ip}</span> },
    ];
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Logs" description="Immutable log of every admin action for compliance and security." />
        <DataTable data={AUDIT_LOGS} columns={columns} searchable={(l) => `${l.actor} ${l.action} ${l.target}`} pageSize={15} bulkActions={false} />
      </div>
    );
  },
});
