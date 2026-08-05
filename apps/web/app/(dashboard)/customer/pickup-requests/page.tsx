"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function PickupRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["pickup-requests"],
    queryFn: () => api.get("/api/pickup-requests/status").then((r) => r.data),
    retry: false,
  });

  const requests = data?.data ?? [];

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Pickup Requests"
        description="Track your laundry pickup requests"
        action={
          <Link href="/customer/pickup-requests/new">
            <Button>New Pickup Request</Button>
          </Link>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon="🚚"
          title="No pickup requests"
          description="Create a pickup request to get started."
          action={
            <Link href="/customer/pickup-requests/new">
              <Button>New Pickup Request</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <Card key={req.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-500">
                      {req.id.slice(0, 8)}...
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Outlet: {req.outlet?.name || req.outlet_id}
                  </p>
                  {req.pickup_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup: {formatDate(req.pickup_date)}{" "}
                      {req.pickup_time_slot && `(${req.pickup_time_slot})`}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
