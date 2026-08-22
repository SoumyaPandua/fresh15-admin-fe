// Deterministic demo data for Fresh15 Admin. Frontend-only, no backend.

const FIRST = ["Aarav","Priya","Rohan","Meera","Kabir","Ananya","Vikram","Isha","Arjun","Diya","Rehan","Zara","Aditya","Kavya","Nikhil","Riya","Sameer","Tara","Yash","Neha","Dev","Sara","Omkar","Pooja","Rahul","Simran","Ishaan","Aisha","Karan","Naina"];
const LAST = ["Sharma","Verma","Iyer","Patel","Kapoor","Rao","Menon","Singh","Nair","Reddy","Bose","Joshi","Malhotra","Chopra","Bhat","Desai","Shah","Gupta","Khan","Pillai"];
const CITIES = ["Bengaluru","Mumbai","Delhi","Hyderabad","Pune","Chennai","Kolkata","Ahmedabad","Jaipur","Gurugram"];
const AREAS = ["Indiranagar","Koramangala","HSR Layout","Whitefield","Jayanagar","Malleshwaram","Bandra","Andheri","Powai","Salt Lake"];

// Simple seeded RNG for stability
let seed = 42;
const rand = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const reset = () => { seed = 42; };

export type Category = { id: string; name: string; slug: string; products: number; active: boolean; icon: string; };
export const CATEGORIES: Category[] = [
  { id: "cat_01", name: "Fresh Vegetables", slug: "vegetables", products: 48, active: true, icon: "🥬" },
  { id: "cat_02", name: "Seasonal Fruits", slug: "fruits", products: 36, active: true, icon: "🍎" },
  { id: "cat_03", name: "Dairy & Eggs", slug: "dairy", products: 22, active: true, icon: "🥛" },
  { id: "cat_04", name: "Bakery", slug: "bakery", products: 18, active: true, icon: "🍞" },
  { id: "cat_05", name: "Beverages", slug: "beverages", products: 27, active: true, icon: "🧃" },
  { id: "cat_06", name: "Snacks", slug: "snacks", products: 44, active: true, icon: "🍿" },
  { id: "cat_07", name: "Meat & Seafood", slug: "meat", products: 15, active: false, icon: "🥩" },
  { id: "cat_08", name: "Pantry Staples", slug: "pantry", products: 62, active: true, icon: "🌾" },
];

export type Product = {
  id: string; name: string; sku: string; category: string;
  price: number; mrp: number; stock: number; unit: string;
  status: "active" | "out_of_stock" | "draft"; image: string;
  sold: number;
};

const PRODUCT_SEED = [
  ["Organic Tomatoes","vegetables","kg",45,60],
  ["Baby Spinach","vegetables","bunch",35,50],
  ["Alphonso Mangoes","fruits","kg",320,380],
  ["Farm Fresh Eggs","dairy","dozen",90,110],
  ["Full Cream Milk","dairy","litre",68,75],
  ["Sourdough Loaf","bakery","piece",180,220],
  ["Cold Pressed OJ","beverages","500ml",149,199],
  ["Roasted Almonds","snacks","250g",320,399],
  ["Basmati Rice","pantry","5kg",549,699],
  ["Extra Virgin Olive Oil","pantry","1L",899,1099],
  ["Avocado","fruits","piece",90,120],
  ["Broccoli","vegetables","piece",75,90],
  ["Greek Yogurt","dairy","400g",180,220],
  ["Croissant Pack","bakery","4pc",240,299],
  ["Kombucha","beverages","330ml",180,220],
  ["Dark Chocolate 70%","snacks","100g",180,220],
  ["Whole Wheat Atta","pantry","5kg",320,399],
  ["Cherry Tomatoes","vegetables","250g",65,80],
  ["Bananas","fruits","dozen",60,75],
  ["Paneer","dairy","200g",95,120],
];

export const PRODUCTS: Product[] = (() => {
  reset();
  const out: Product[] = [];
  for (let i = 0; i < 60; i++) {
    const s = PRODUCT_SEED[i % PRODUCT_SEED.length];
    const stock = int(0, 200);
    out.push({
      id: `prd_${String(i + 1).padStart(4, "0")}`,
      name: `${s[0]}${i >= PRODUCT_SEED.length ? " " + (Math.floor(i / PRODUCT_SEED.length) + 1) : ""}`,
      sku: `F15-${String(1000 + i)}`,
      category: s[1] as string,
      price: s[3] as number,
      mrp: s[4] as number,
      stock,
      unit: s[2] as string,
      status: stock === 0 ? "out_of_stock" : rand() > 0.92 ? "draft" : "active",
      image: `https://picsum.photos/seed/f15p${i}/80`,
      sold: int(20, 900),
    });
  }
  return out;
})();

export type Customer = {
  id: string; name: string; email: string; phone: string;
  city: string; orders: number; spent: number; joined: string;
  status: "active" | "vip" | "inactive"; avatar: string;
};

export const CUSTOMERS: Customer[] = (() => {
  reset();
  const out: Customer[] = [];
  for (let i = 0; i < 80; i++) {
    const first = pick(FIRST); const last = pick(LAST);
    const orders = int(1, 60);
    out.push({
      id: `cus_${String(i + 1).padStart(4, "0")}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+91 9${int(100000000, 999999999)}`,
      city: pick(CITIES),
      orders,
      spent: orders * int(280, 1600),
      joined: new Date(Date.now() - int(1, 500) * 86400000).toISOString(),
      status: orders > 40 ? "vip" : orders < 3 ? "inactive" : "active",
      avatar: `https://i.pravatar.cc/80?img=${(i % 70) + 1}`,
    });
  }
  return out;
})();

export type Partner = {
  id: string; name: string; phone: string; vehicle: string;
  zone: string; rating: number; deliveries: number;
  status: "online" | "offline" | "on_delivery"; avatar: string; joined: string;
};

export const PARTNERS: Partner[] = (() => {
  reset();
  const out: Partner[] = [];
  const vehicles = ["Bike","Scooter","EV Bike","Bicycle"];
  const statuses: Partner["status"][] = ["online","offline","on_delivery"];
  for (let i = 0; i < 32; i++) {
    const first = pick(FIRST); const last = pick(LAST);
    out.push({
      id: `dp_${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      phone: `+91 9${int(100000000, 999999999)}`,
      vehicle: pick(vehicles),
      zone: pick(AREAS),
      rating: Number((3.8 + rand() * 1.2).toFixed(1)),
      deliveries: int(20, 1200),
      status: statuses[i % 3],
      avatar: `https://i.pravatar.cc/80?img=${(i % 70) + 12}`,
      joined: new Date(Date.now() - int(30, 720) * 86400000).toISOString(),
    });
  }
  return out;
})();

export type OrderStatus = "pending" | "live" | "completed" | "cancelled";
export type PayMethod = "cod" | "razorpay" | "upi" | "wallet";
export type OrderItem = { productId: string; name: string; qty: number; price: number; };
export type Order = {
  id: string; number: string; customerId: string; partnerId?: string;
  status: OrderStatus; items: OrderItem[]; subtotal: number; delivery: number; discount: number; total: number;
  payMethod: PayMethod; payStatus: "paid" | "pending" | "refunded";
  address: string; area: string; city: string;
  createdAt: string; updatedAt: string;
  timeline: { at: string; label: string; }[];
};

export const ORDERS: Order[] = (() => {
  reset();
  const out: Order[] = [];
  const statuses: OrderStatus[] = ["pending","live","completed","cancelled"];
  const pays: PayMethod[] = ["cod","razorpay","upi","wallet"];
  for (let i = 0; i < 220; i++) {
    const cust = CUSTOMERS[i % CUSTOMERS.length];
    const nItems = int(1, 5);
    const items: OrderItem[] = [];
    for (let k = 0; k < nItems; k++) {
      const p = PRODUCTS[int(0, PRODUCTS.length - 1)];
      const qty = int(1, 4);
      items.push({ productId: p.id, name: p.name, qty, price: p.price });
    }
    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const delivery = subtotal > 499 ? 0 : 29;
    const discount = rand() > 0.7 ? int(20, 120) : 0;
    const total = subtotal + delivery - discount;
    const statusIdx = i < 18 ? 0 : i < 40 ? 1 : i < 200 ? 2 : 3;
    const status = statuses[statusIdx];
    const partner = status !== "pending" ? PARTNERS[i % PARTNERS.length] : undefined;
    const createdAt = new Date(Date.now() - i * 1000 * 60 * int(5, 90)).toISOString();
    const timeline = [
      { at: createdAt, label: "Order placed" },
      ...(status !== "pending" ? [{ at: new Date(new Date(createdAt).getTime() + 3 * 60000).toISOString(), label: "Confirmed" }] : []),
      ...(status === "live" || status === "completed" ? [{ at: new Date(new Date(createdAt).getTime() + 8 * 60000).toISOString(), label: "Picked up by partner" }] : []),
      ...(status === "completed" ? [{ at: new Date(new Date(createdAt).getTime() + 22 * 60000).toISOString(), label: "Delivered" }] : []),
      ...(status === "cancelled" ? [{ at: new Date(new Date(createdAt).getTime() + 6 * 60000).toISOString(), label: "Cancelled" }] : []),
    ];
    out.push({
      id: `ord_${String(i + 1).padStart(5, "0")}`,
      number: `F15-${100000 + i}`,
      customerId: cust.id,
      partnerId: partner?.id,
      status,
      items, subtotal, delivery, discount, total,
      payMethod: pays[i % pays.length],
      payStatus: status === "cancelled" ? "refunded" : status === "pending" ? "pending" : "paid",
      address: `${int(1, 300)}, ${pick(AREAS)}`,
      area: pick(AREAS),
      city: cust.city,
      createdAt,
      updatedAt: createdAt,
      timeline,
    });
  }
  return out;
})();

export type Coupon = { id: string; code: string; type: "percent" | "flat"; value: number; minOrder: number; usage: number; limit: number; expires: string; active: boolean; };
export const COUPONS: Coupon[] = [
  { id: "cpn_01", code: "FRESH15", type: "percent", value: 15, minOrder: 299, usage: 1284, limit: 5000, expires: "2026-08-30", active: true },
  { id: "cpn_02", code: "NEW50", type: "flat", value: 50, minOrder: 199, usage: 3402, limit: 10000, expires: "2026-12-31", active: true },
  { id: "cpn_03", code: "WEEKEND", type: "percent", value: 10, minOrder: 499, usage: 512, limit: 2000, expires: "2026-07-30", active: true },
  { id: "cpn_04", code: "BIGSAVE100", type: "flat", value: 100, minOrder: 799, usage: 220, limit: 1000, expires: "2026-09-15", active: false },
  { id: "cpn_05", code: "MONSOON", type: "percent", value: 20, minOrder: 599, usage: 88, limit: 1500, expires: "2026-08-15", active: true },
];

export type Offer = { id: string; title: string; description: string; discount: string; category: string; active: boolean; };
export const OFFERS: Offer[] = [
  { id: "ofr_01", title: "Fruits Fiesta", description: "Up to 30% off on seasonal fruits", discount: "30%", category: "fruits", active: true },
  { id: "ofr_02", title: "Dairy Delight", description: "Buy 1 Get 1 on selected dairy", discount: "BOGO", category: "dairy", active: true },
  { id: "ofr_03", title: "Bakery Bundle", description: "Flat ₹50 off on ₹299", discount: "₹50", category: "bakery", active: true },
  { id: "ofr_04", title: "Snack Attack", description: "Buy 2 packs, get 20% off", discount: "20%", category: "snacks", active: false },
];

export type Banner = { id: string; title: string; subtitle: string; placement: string; active: boolean; image: string; };
export const BANNERS: Banner[] = [
  { id: "bnr_01", title: "Fresh from farm", subtitle: "Delivered in 15 minutes", placement: "Home Hero", active: true, image: "https://picsum.photos/seed/bnr1/400/200" },
  { id: "bnr_02", title: "Weekend Fruit Sale", subtitle: "Up to 30% off", placement: "Home Mid", active: true, image: "https://picsum.photos/seed/bnr2/400/200" },
  { id: "bnr_03", title: "Dairy Bonanza", subtitle: "BOGO offers", placement: "Category: Dairy", active: false, image: "https://picsum.photos/seed/bnr3/400/200" },
];

export type Ticket = {
  id: string; subject: string; customer: string; priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "resolved" | "closed"; createdAt: string; orderId?: string;
};
export const TICKETS: Ticket[] = (() => {
  reset();
  const subjects = ["Missing item","Late delivery","Refund request","Wrong item delivered","Payment failed","Cancel order","App crash","Coupon not working"];
  const priorities: Ticket["priority"][] = ["low","medium","high","urgent"];
  const statuses: Ticket["status"][] = ["open","pending","resolved","closed"];
  const out: Ticket[] = [];
  for (let i = 0; i < 42; i++) {
    const c = CUSTOMERS[int(0, 40)];
    out.push({
      id: `tkt_${String(i + 1).padStart(4, "0")}`,
      subject: pick(subjects),
      customer: c.name,
      priority: priorities[i % 4],
      status: statuses[i % 4],
      createdAt: new Date(Date.now() - i * 3600 * 1000 * int(1, 12)).toISOString(),
      orderId: rand() > 0.3 ? ORDERS[int(0, 100)].number : undefined,
    });
  }
  return out;
})();

export type Zone = { id: string; name: string; area: string; fee: number; minOrder: number; active: boolean; partners: number; };
export const ZONES: Zone[] = AREAS.slice(0, 8).map((a, i) => ({
  id: `zn_${i + 1}`, name: `Zone ${String.fromCharCode(65 + i)}`, area: a,
  fee: [0, 19, 29, 39][i % 4], minOrder: [199, 249, 299, 349][i % 4], active: i !== 6, partners: 3 + (i % 5),
}));

export type Slot = { id: string; label: string; from: string; to: string; capacity: number; booked: number; active: boolean; };
export const SLOTS: Slot[] = [
  { id: "sl_1", label: "Express (15 min)", from: "09:00", to: "23:00", capacity: 200, booked: 142, active: true },
  { id: "sl_2", label: "Morning", from: "07:00", to: "10:00", capacity: 80, booked: 55, active: true },
  { id: "sl_3", label: "Afternoon", from: "12:00", to: "16:00", capacity: 100, booked: 61, active: true },
  { id: "sl_4", label: "Evening", from: "17:00", to: "21:00", capacity: 120, booked: 118, active: true },
  { id: "sl_5", label: "Late night", from: "21:00", to: "23:00", capacity: 40, booked: 12, active: false },
];

export type AuditLog = { id: string; actor: string; action: string; target: string; at: string; ip: string; };
export const AUDIT_LOGS: AuditLog[] = (() => {
  reset();
  const actions = ["Updated product","Deleted coupon","Refunded order","Created banner","Changed store hours","Approved partner","Updated zone","Sent notification","Bulk import products"];
  const actors = ["Aarav Sharma (Admin)","Priya Iyer (Ops Manager)","Kabir Reddy (Support Lead)","System"];
  const out: AuditLog[] = [];
  for (let i = 0; i < 60; i++) {
    out.push({
      id: `log_${i + 1}`,
      actor: pick(actors),
      action: pick(actions),
      target: `#${int(10000, 99999)}`,
      at: new Date(Date.now() - i * 1000 * 60 * int(3, 120)).toISOString(),
      ip: `10.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
    });
  }
  return out;
})();

// Analytics timeseries
export const REVENUE_SERIES = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 42000 + Math.sin(i / 4) * 12000 + i * 900;
  return {
    date: d.toISOString().slice(0, 10),
    revenue: Math.round(base + (i % 7 === 0 ? 8000 : 0)),
    orders: Math.round(90 + Math.sin(i / 3) * 20 + i * 1.4),
  };
});

export const CATEGORY_MIX = CATEGORIES.slice(0, 6).map((c, i) => ({
  name: c.name, value: [32, 24, 14, 10, 12, 8][i],
}));

export const HOURLY_ORDERS = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, "0")}:00`,
  orders: Math.max(2, Math.round(15 + Math.sin((h - 6) / 4) * 22 + (h >= 18 && h <= 21 ? 20 : 0))),
}));

export function customerById(id: string) { return CUSTOMERS.find(c => c.id === id); }
export function partnerById(id?: string) { return id ? PARTNERS.find(p => p.id === id) : undefined; }
export function orderByNumber(num: string) { return ORDERS.find(o => o.number === num); }
