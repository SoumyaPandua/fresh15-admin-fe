import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "./EmptyState";
import { ChevronLeft, ChevronRight, Download, Filter, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  accessor?: (row: T) => string | number;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  searchable?: (row: T) => string;
  filters?: ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowId?: (row: T) => string;
  bulkActions?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<T>({
  data, columns, searchable, filters, pageSize = 10, onRowClick, rowId,
  bulkActions = true, emptyTitle = "No results", emptyDescription = "Try adjusting your search or filters.",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(() => {
    let r = data;
    if (q && searchable) {
      const query = q.toLowerCase();
      r = r.filter((x) => searchable(x).toLowerCase().includes(query));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.accessor) {
        const acc = col.accessor;
        r = [...r].sort((a, b) => {
          const av = acc(a); const bv = acc(b);
          if (av < bv) return sort.dir === "asc" ? -1 : 1;
          if (av > bv) return sort.dir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return r;
  }, [data, q, sort, columns, searchable]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  const idOf = rowId ?? ((row: T) => (row as any).id as string);
  const allChecked = slice.length > 0 && slice.every((r) => selected.has(idOf(r)));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) slice.forEach((r) => next.delete(idOf(r)));
    else slice.forEach((r) => next.add(idOf(r)));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (!sort || sort.key !== col.key) setSort({ key: col.key, dir: "desc" });
    else if (sort.dir === "desc") setSort({ key: col.key, dir: "asc" });
    else setSort(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchable && (
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search..." className="h-9 pl-9" />
          </div>
        )}
        {filters}
        <div className="ml-auto flex items-center gap-2">
          {bulkActions && selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/60 px-2 py-1 text-xs">
              <span className="font-medium">{selected.size} selected</span>
              <Button size="sm" variant="ghost" className="h-7 px-2"
                onClick={() => { toast.success(`Deleted ${selected.size} item(s)`); setSelected(new Set()); }}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" className="h-9" onClick={() => toast.success("Export queued")}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {bulkActions && (
                  <TableHead className="w-10">
                    <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all" />
                  </TableHead>
                )}
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.sortable ? (
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(c)}>
                        {c.header}
                        {sort?.key === c.key && <span className="text-[10px]">{sort.dir === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    ) : c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length + (bulkActions ? 1 : 0)} className="p-0">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </TableCell>
                </TableRow>
              )}
              {slice.map((row) => {
                const id = idOf(row);
                return (
                  <TableRow key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={onRowClick ? "cursor-pointer" : ""}>
                    {bulkActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(id)} onCheckedChange={() => toggleOne(id)} aria-label="Select row" />
                      </TableCell>
                    )}
                    {columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>{c.render(row)}</TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          Showing <span className="font-medium text-foreground">{slice.length === 0 ? 0 : (cur - 1) * pageSize + 1}</span>–
          <span className="font-medium text-foreground">{(cur - 1) * pageSize + slice.length}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center font-medium text-foreground">{cur} / {pages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FilterChip({ children, onClick, active }: { children: ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
      }`}>
      <Filter className="h-3.5 w-3.5" /> {children}
    </button>
  );
}
