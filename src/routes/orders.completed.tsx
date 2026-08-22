"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { OrdersView } from "./orders.index";

export const Route = createFileRoute("/orders/completed")({
  head: () => ({
    meta: [
      { title: "Completed Orders — Fresh15 Admin" },
      { name: "description", content: "Successfully delivered orders." },
      { property: "og:title", content: "Completed Orders — Fresh15 Admin" },
      { property: "og:description", content: "Successfully delivered orders." },
    ],
  }),
  component: () => <OrdersView title="Completed Orders" description="Successfully delivered orders." group="completed" />,
});
