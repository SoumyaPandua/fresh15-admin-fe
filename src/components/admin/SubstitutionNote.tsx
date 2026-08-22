import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  itemReplacement,
  itemReplacementId,
  itemSubstitution,
  productImage,
  substitutionLabel,
  substitutionTone,
  type ApiOrderItem,
} from "@/lib/commerce";
import { PhoneCall, Repeat, ShieldAlert, Replace } from "lucide-react";

const icons = {
  CALL_ME: PhoneCall,
  BEST_SIMILAR: Repeat,
  DO_NOT_SUBSTITUTE: ShieldAlert,
  SPECIFIC_PRODUCT: Replace,
} as const;

/**
 * Compact operator-facing note showing the customer's out-of-stock
 * substitution preference for a single order item.
 */
export function SubstitutionNote({ item }: { item: ApiOrderItem }) {
  const pref = itemSubstitution(item);
  if (!pref) return null;

  const Icon = icons[pref];
  const replacement = pref === "SPECIFIC_PRODUCT" ? itemReplacement(item) : null;
  const image = productImage(replacement);
  const fallbackId = pref === "SPECIFIC_PRODUCT" ? itemReplacementId(item) : null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">If out of stock</span>
        <StatusBadge label={substitutionLabel(pref)} tone={substitutionTone(pref) as never} />
      </div>
      {pref === "SPECIFIC_PRODUCT" && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-2">
          {image ? (
            <img src={image} alt={replacement?.name ?? "Replacement product"} className="h-8 w-8 rounded object-cover" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded bg-muted">
              <Replace className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 text-xs">
            <div className="truncate font-medium">{replacement?.name ?? "Replacement product"}</div>
            <div className="truncate text-muted-foreground">
              {replacement?.name ? (replacement.unit ?? "Customer-selected replacement") : (fallbackId ?? "—")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline chip used in dense lists (e.g. order tables). */
export function SubstitutionChip({ item }: { item: ApiOrderItem }) {
  const pref = itemSubstitution(item);
  if (!pref) return null;
  return <StatusBadge label={substitutionLabel(pref)} tone={substitutionTone(pref) as never} dot={false} />;
}
