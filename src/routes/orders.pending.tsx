"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { OrdersView } from "./orders.index";

export const Route = createFileRoute("/orders/pending")({
  head: () => ({
    meta: [
      { title: "Pending Orders — Fresh15 Admin" },
      { name: "description", content: "Orders awaiting confirmation." },
      { property: "og:title", content: "Pending Orders — Fresh15 Admin" },
      { property: "og:description", content: "Orders awaiting confirmation." },
    ],
  }),
  component: () => <OrdersView title="Pending Orders" description="Awaiting confirmation." group="pending" />,
});
