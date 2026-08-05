"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default function WalkInsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["walk-in-customers"],
    queryFn: () => api.get("/api/walk-in-customer").then((r) => r.data),
    retry: false,
  });

  const customers = data?.data ?? [];

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Walk-in Customers"
        description="Manage walk-in customer orders"
        action={
          <Link href="/outlet-admin/walk-ins/new">
            <Button>New Walk-in</Button>
          </Link>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon="🧑"
          title="No walk-in customers"
          description="Create a new walk-in customer to get started."
          action={
            <Link href="/outlet-admin/walk-ins/new">
              <Button>New Walk-in</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
