
import { createFileRoute } from "@/lib/next-router-compat";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  catalogTemplateUrl,
  createCatalogImport,
  getCatalogImports,
  importReportUrl,
  previewCatalogImport,
  retryCatalogImport,
  useCatalogOperationsOverview,
  useCatalogQuality,
  type CatalogImportJob,
} from "@/lib/catalog-operations-api";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, FileSpreadsheet, Image as ImageIcon, Loader2, RefreshCw, RotateCcw, Upload, XCircle } from "lucide-react";

export const Route = createFileRoute("/catalog-operations")({
  head: () => ({ meta: [
    { title: "Catalog Operations — Fresh15 Admin" },
    { name: "description", content: "Bulk catalog import, image processing and product quality control." },
  ] }),
  component: CatalogOperationsPage,
});

function CatalogOperationsPage() {
  const { token } = useAuth();
  const overviewQuery = useCatalogOperationsOverview();
  const qualityQuery = useCatalogQuality();
  const [file, setFile] = useState<File | null>(null);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewCatalogImport>> | null>(null);
  const [importing, setImporting] = useState(false);
  const [imports, setImports] = useState<CatalogImportJob[]>([]);
  const [retrying, setRetrying] = useState<string | null>(null);

  const loadImports = async () => {
    try { setImports(await getCatalogImports(token)); } catch {}
  };

  useEffect(() => { void loadImports(); }, [token]);

  const refreshAll = async () => {
    await Promise.all([overviewQuery.refetch(), qualityQuery.refetch(), loadImports()]);
  };

  const readFile = async (selected: File | null) => {
    setFile(selected);
    setPreview(null);
    if (!selected) { setCsv(""); return; }
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a CSV file");
      setFile(null);
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      toast.error("CSV must be 2 MB or smaller");
      setFile(null);
      return;
    }
    try { setCsv(await selected.text()); }
    catch { setCsv(""); toast.error("Unable to read CSV file"); }
  };

  const previewImport = async () => {
    if (!csv) return;
    try {
      const result = await previewCatalogImport(token, csv);
      setPreview(result);
      toast.success(`Preview ready: ${result.validCount} valid, ${result.invalidCount} invalid`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    }
  };

  const commitImport = async () => {
    if (!csv || !preview?.canCommit || importing) return;
    setImporting(true);
    try {
      await createCatalogImport(token, csv, file?.name || "catalog.csv");
      toast.success("Catalog import queued");
      setFile(null);
      setCsv("");
      setPreview(null);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally { setImporting(false); }
  };

  const retry = async (id: string) => {
    if (retrying) return;
    setRetrying(id);
    try {
      await retryCatalogImport(token, id);
      toast.success("Failed rows re-queued");
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Retry failed");
    } finally { setRetrying(null); }
  };

  const qualityItems = qualityQuery.data?.items ?? [];
  const lowest = useMemo(() => qualityItems.slice(0, 10), [qualityItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog Operations"
        description="Bulk import, image processing and product quality control."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void refreshAll()} disabled={overviewQuery.isFetching || qualityQuery.isFetching}>
              <RefreshCw className={`h-4 w-4 ${overviewQuery.isFetching || qualityQuery.isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={catalogTemplateUrl} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Template</a>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Products" value={overviewQuery.data?.products ?? "—"} />
        <Metric label="Active" value={overviewQuery.data?.activeProducts ?? "—"} />
        <Metric label="Categories" value={overviewQuery.data?.categories ?? "—"} />
        <Metric label="Quality" value={overviewQuery.data?.quality?.averageScore != null ? `${overviewQuery.data.quality.averageScore}/100` : "—"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Queued imports" value={overviewQuery.data?.queuedImports ?? "—"} />
        <Metric label="Failed imports" value={overviewQuery.data?.failedImports ?? "—"} />
        <Metric label="Low stock" value={overviewQuery.data?.quality?.lowStock ?? "—"} />
        <Metric label="Out of stock" value={overviewQuery.data?.quality?.outOfStock ?? "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><FileSpreadsheet className="h-5 w-5" /></div>
            <div><div className="font-semibold">Bulk catalog import</div><div className="text-xs text-muted-foreground">CSV → validate → preview → background import.</div></div>
          </div>
          <input className="mt-4 block w-full text-sm" type="file" accept=".csv,text/csv" onChange={(e) => void readFile(e.target.files?.[0] ?? null)} />
          {file && <div className="mt-2 text-xs text-muted-foreground">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" disabled={!csv} onClick={() => void previewImport()}><Upload className="h-4 w-4" /> Preview</Button>
            <Button disabled={!preview?.canCommit || importing} onClick={() => void commitImport()}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Import valid rows
            </Button>
          </div>
          {preview && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <Summary label="Valid" value={preview.validCount} />
                <Summary label="Invalid" value={preview.invalidCount} />
                <Summary label="Warnings" value={preview.warningCount} />
              </div>
              <div className="mt-4 max-h-48 overflow-auto rounded-xl border text-xs">
                {preview.rows.map((row) => (
                  <div key={row.rowNumber} className="grid grid-cols-[44px_1fr_auto] gap-2 border-b px-3 py-2 last:border-0">
                    <span className="text-muted-foreground">#{row.rowNumber}</span>
                    <div className="min-w-0"><div className="truncate font-medium">{row.name || row.sku}</div><div className="truncate text-muted-foreground">{row.sku} · {row.category}</div></div>
                    <div className="text-right">{row.issues.length ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold"><ImageIcon className="h-4 w-4 text-primary" /> Bulk image processing</div>
          <p className="mt-1 text-xs text-muted-foreground">Image URLs from the import are processed in the background through Cloudinary. Optimized delivery variants are generated automatically.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Summary label="Images missing" value={overviewQuery.data?.quality?.missingImages ?? "—"} />
            <Summary label="Reserved units" value={overviewQuery.data?.inventory?.reservedUnits ?? "—"} />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div><div className="font-semibold">Catalog quality</div><div className="text-xs text-muted-foreground">Lowest-scoring products first.</div></div>
          <div className="text-xs text-muted-foreground">{qualityQuery.data?.summary?.averageScore ?? 0}/100 average</div>
        </div>
        <div className="mt-4 divide-y">
          {lowest.map((item) => (
            <div key={item.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_90px_100px] sm:items-center">
              <div className="min-w-0"><div className="truncate text-sm font-medium">{item.name}</div><div className="truncate text-xs text-muted-foreground">{item.sku} · {item.category} · {item.issues.join(", ") || "No issues"}</div></div>
              <div className={`text-sm font-bold ${item.grade === "GOOD" ? "text-green-600" : item.grade === "NEEDS_WORK" ? "text-amber-600" : "text-red-600"}`}>{item.score}/100</div>
              <div className="text-right text-xs text-muted-foreground">{item.stock} available</div>
            </div>
          ))}
          {!lowest.length && <div className="py-8 text-center text-sm text-muted-foreground">No quality data yet.</div>}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between"><div className="font-semibold">Recent imports</div></div>
        <div className="mt-3 divide-y">
          {imports.map((job) => (
            <div key={job._id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div><div className="text-sm font-medium">{job.fileName}</div><div className="text-xs text-muted-foreground">{job.rowCount} rows · {job.successCount} success · {job.failedCount} failed · {job.skippedCount} skipped</div></div>
              <div className="text-xs font-semibold">{job.status}</div>
              <div className="flex gap-1">
                {(job.failedCount > 0 || job.status === "COMPLETED_WITH_ERRORS") && (
                  <>
                    <Button variant="ghost" size="sm" asChild><a href={importReportUrl(job._id)} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Report</a></Button>
                    <Button variant="ghost" size="sm" onClick={() => void retry(job._id)} disabled={retrying === job._id}>
                      {retrying === job._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Retry
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!imports.length && <div className="py-8 text-center text-sm text-muted-foreground">No imports yet.</div>}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <Card className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></Card>;
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-muted p-3"><div className="text-[11px] text-muted-foreground">{label}</div><div className="mt-0.5 text-lg font-bold">{value}</div></div>;
}
