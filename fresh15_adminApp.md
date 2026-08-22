# Fresh15 Admin App — Documentation

A high-fidelity, frontend-only admin console for the Fresh15 grocery platform. All data is mock/demo; every API is simulated. Built with TanStack Start, TanStack Router, TailwindCSS, shadcn/ui, Recharts, and Sonner.

---

## 1. Overview

Fresh15 Admin is an enterprise-grade dashboard that lets operators manage the entire Fresh15 marketplace — orders, customers, delivery partners, inventory, marketing, payments, support, notifications, and store settings. Its design language mirrors the Fresh15 Customer App (green primary, oklch tokens, rounded 2xl cards, generous whitespace).

- **Frontend only** — no backend, no network calls.
- **Deterministic mock data** — `src/lib/mock-data.ts` seeds every entity (products, orders, customers, partners) so relationships stay consistent.
- **Live mutations** — all Add/Edit/Delete actions mutate local React state, so the console feels fully functional within a session.
- **Ready for backend integration** — every mutation is isolated in a single component, easy to swap for real API calls.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start v1 (React 19, Vite 7) |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Styling | Tailwind v4 + shadcn/ui + custom Fresh15 theme in `src/styles.css` |
| Charts | Recharts |
| Toasts | Sonner |
| Icons | Lucide React |
| Auth | Local mock (`localStorage`) via `src/lib/auth.tsx` |

---

## 3. Authentication

Fully client-side mock. Users and sessions persist in `localStorage`.

| Route | Purpose |
|---|---|
| `/auth/login` | Email + password login. Demo credentials shown on card. |
| `/auth/signup` | Create a new admin account. |
| `/auth/forgot-password` | Enter email → mock reset token generated + revealed. |
| `/auth/reset-password?token=…` | Set a new password using the token. |

Default demo account: **admin@fresh15.in / admin123**.

Guard behavior:
- Unauthenticated users hitting any `/…` route are redirected to `/auth/login`.
- Authenticated users hitting `/auth/*` are redirected to `/` (dashboard).
- `logout()` clears the session and returns to login.

---

## 4. App Shell

- **AppSidebar** — grouped nav (Overview, Orders, People, Catalog, Marketing, Payments, Ops, Insights). Collapsible to icon rail on desktop; off-canvas on mobile. Footer shows the signed-in admin.
- **TopBar** — sidebar trigger, global search input (⌘K hint), theme toggle (light/dark persisted in `localStorage` as `f15-theme`), functional **Notification Bell** (popover with unread badge + mark-all-read + individual delete), and **User Menu** (profile, settings, logout).
- **PageHeader** — every page: title, description, and optional right-aligned action buttons.

---

## 5. Modules & Features

### 5.1 Dashboard (`/`)
KPI grid (revenue, orders, AOV, active customers) · Revenue area chart · Orders/hour bar chart · Category mix pie · Recent orders table · Live delivery partners feed · **New Order** quick action.

### 5.2 Revenue (`/revenue`)
Gross vs Net revenue trend · Category revenue breakdown · Payment method split · Refund impact.

### 5.3 Orders
| Route | Filter |
|---|---|
| `/orders` | All |
| `/orders/pending` | Pending only |
| `/orders/live` | Out for delivery |
| `/orders/completed` | Delivered |
| `/orders/cancelled` | Cancelled |

Table columns: Order # · Customer · Items · Total · Payment · Status · Partner. Row click opens a **detail drawer** showing customer, delivery address, line items, invoice totals, assigned partner (with Assign action), and a vertical timeline (placed → picked → delivered).

### 5.4 Customers (`/customers`)
Full CRUD. Add customer dialog, per-row Edit / Change Status / Delete actions, VIP badge, order count, lifetime value.

### 5.5 Delivery Partners (`/delivery-partners`)
Onboard partner form, status dropdown (online/offline/busy), rating & zone display, remove partner with confirmation.

### 5.6 Inventory
- **Products** (`/inventory/products`) — New / Edit / Duplicate / Delete / Bulk Import. Stock status badges (in-stock, low, out).
- **Categories** (`/inventory/categories`) — Add / Edit / Delete / visibility toggle.

### 5.7 Marketing
- **Coupons** (`/marketing/coupons`) — Add / Edit / Delete / Copy code. Usage progress bar with limit.
- **Offers** (`/marketing/offers`) — Card grid. Toggle live, Edit, Delete.
- **Banners** (`/marketing/banners`) — Card grid with image preview. Add / Edit / Delete / live toggle.

### 5.8 Payments
- **Razorpay** (`/payments/razorpay`) — Mock settlement dashboard.
- **COD** (`/payments/cod`) — Cash collection report by partner.
- **Refunds** (`/payments/refunds`) — Approve / reject flow with confirmation dialog.

### 5.9 Support (`/support`)
KPIs (open, pending, resolved, avg response). Filter chips by status. Row click opens ticket drawer with reply textarea, **Send reply** (auto-moves to pending), **Resolve**. Row actions: Reply, Mark resolved, Close. **New Ticket** dialog with priority select.

### 5.10 Notifications (`/notifications`)
Push campaign composer (Title / Message / Audience) → simulated delivery with random open-rate. Recent campaigns list with delete.

### 5.11 Settings
- **Store** (`/settings/store`) — Business hours, contact, taxes, invoice settings.
- **Zones** (`/settings/zones`) — CRUD for delivery zones (name, area, fee, min order, partners, active toggle).
- **Slots** (`/settings/slots`) — CRUD for time slots with capacity utilisation bar.

### 5.12 Analytics (`/analytics`)
Cohort retention, funnel conversions, top products, city split.

### 5.13 Audit Logs (`/audit-logs`)
Read-only compliance log — actor, action, target, timestamp, IP.

### 5.14 Profile (`/profile`)
Personal info, 2FA toggle, session auto-lock, notification preferences.

---

## 6. Reusable Components (`src/components/admin/`)

| Component | Purpose |
|---|---|
| `AppSidebar` | Grouped, collapsible primary nav. |
| `TopBar` | Sticky header, search, theme, notifications, user menu. |
| `PageHeader` | Consistent page title + actions. |
| `StatCard` | KPI tile with delta trend and semantic tone. |
| `StatusBadge` | Semantic pills (success/warning/danger/info/neutral). |
| `DataTable` | Generic table — search, sort, pagination, bulk select, filter chips slot, row click, empty state. |
| `EmptyState` | Icon + copy + CTA when data is empty. |
| `LoadingSkeleton` | Skeleton rows/cards. |
| `ConfirmDialog` | AlertDialog wrapper for destructive actions. |
| `NotificationBell` | Popover with unread count, mark all read, per-item delete. |
| `UserMenu` | Avatar dropdown → profile, settings, logout. |

---

## 7. Design System

Defined in `src/styles.css` using Tailwind v4 `@theme`:
- **Primary**: Fresh15 Green (oklch)
- **Radii**: `2xl` default on cards, `xl` on inputs
- **Typography**: system UI stack; numeric column uses `.number` (tabular-nums)
- **Dark mode**: `.dark` class on `<html>`; toggled from TopBar, persisted in `localStorage`
- **Semantic tones**: `--success`, `--warning`, `--info`, `--destructive`

---

## 8. Mock Data Model

Central seed in `src/lib/mock-data.ts` with a deterministic RNG. Key relationships:

```
Order ── customerId ──► Customer
      ── partnerId  ──► Partner (nullable)
      ── items[]    ──► Product (by name/price snapshot)
      ── timeline[] ──► placed → picked → out → delivered/cancelled
```

Entities: `Category`, `Product`, `Customer`, `Partner`, `Order`, `Coupon`, `Offer`, `Banner`, `Ticket`, `Notification`, `Zone`, `Slot`, `AuditLog`.

Helpers: `customerById()`, `partnerById()`, `productById()`.

---

## 9. UX Patterns

- **Drawer forms** — Order detail, ticket detail.
- **Modal forms** — All create/edit flows (compact, focused).
- **Confirm dialogs** — All destructive actions.
- **Toast feedback** — Every mutation via Sonner.
- **Filter chips** — Status filters on Orders and Support.
- **Empty states** — Custom illustration + CTA when a table is empty.
- **Responsive** — Sidebar collapses; tables scroll horizontally on mobile; grids reflow at `sm/md/lg/xl`.

---

## 10. Use Cases

1. **Ops manager** monitors live orders on Dashboard, opens a live order drawer, and assigns a delivery partner.
2. **Support agent** filters open tickets, replies from the drawer, resolves them.
3. **Catalog manager** adds a new product, sets stock, toggles category visibility.
4. **Growth marketer** creates a coupon, launches a banner, schedules a push notification to all customers.
5. **Finance analyst** reviews Razorpay settlements, approves refunds.
6. **Compliance officer** exports Audit Logs for a specific admin actor.
7. **Store admin** updates business hours, adds a new delivery zone, tunes time-slot capacity.

---

## 11. Backend Integration Guide

Each mutation lives in a single component and uses local `useState`. To wire a real backend:

1. Replace the seed import (`SEED`) with a fetch (TanStack Query recommended — `queryClient` is already in router context).
2. Swap `setState` mutations for mutation hooks (`useMutation` → optimistic update → invalidate).
3. Replace `src/lib/auth.tsx` local storage logic with a real auth provider (Supabase, Lovable Cloud, etc.).
4. Move any privileged actions behind a `_authenticated` layout route.

No component reaches for global state outside its file — the surface is intentionally small.

---

## 12. Route Map

```
/                              Dashboard
/revenue                       Revenue analytics
/orders, /orders/{pending|live|completed|cancelled}
/customers
/delivery-partners
/inventory/{products,categories}
/marketing/{coupons,offers,banners}
/payments/{razorpay,cod,refunds}
/support
/notifications
/settings/{store,zones,slots}
/analytics
/audit-logs
/profile
/auth/{login,signup,forgot-password,reset-password}
```

---

Built to feel like Stripe · Linear · Vercel · Shopify Admin — but for a hyper-local grocery operation.
