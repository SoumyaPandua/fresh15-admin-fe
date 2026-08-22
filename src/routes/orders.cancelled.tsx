"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { OrdersView } from "./orders.index";

export const Route = createFileRoute("/orders/cancelled")({
  head: () => ({
    meta: [
      { title: "Cancelled Orders — Fresh15 Admin" },
      { name: "description", content: "Cancelled and refunded orders." },
      { property: "og:title", content: "Cancelled Orders — Fresh15 Admin" },
      { property: "og:description", content: "Cancelled and refunded orders." },
    ],
  }),
  component: () => <OrdersView title="Cancelled Orders" description="Cancelled and refunded orders." group="cancelled" />,
});
