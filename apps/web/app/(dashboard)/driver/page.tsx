"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import StatCard from "@/components/ui/stat-card";
import Button from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";

export default function DriverDashboard() {
  const { data: pickupsData, isLoading } = useQuery({
    queryKey: ["driver-pickups"],
    queryFn: () => api.get("/api/pickup-requests").then((r) => r.data),
    retry: false,
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ["driver-deliveries"],
    queryFn: () => api.get("/api/delivery-requests").then((r) => r.data),
    retry: false,
  });

  const pickups = pickupsData?.data ?? [];
  const deliveries = deliveriesData?.data ?? [];
  const pendingPickups = pickups.filter((p: any) => p.status === "pending");
  const pendingDeliveries = deliveries.filter(
    (d: any) => d.status === "pending",
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage pickups and deliveries
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Pending Pickups"
          value={pendingPickups.length}
          icon={<span className="text-xl">📦</span>}
        />
        <StatCard
          label="Pending Deliveries"
          value={pendingDeliveries.length}
          icon={<span className="text-xl">🚚</span>}
        />
        <StatCard
          label="Total Requests"
          value={pickups.length + deliveries.length}
          icon={<span className="text-xl">📋</span>}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/driver/pickups">
          <Button>View Pickups</Button>
        </Link>
        <Link href="/driver/deliveries">
          <Button variant="outline">View Deliveries</Button>
        </Link>
      </div>

      {pendingPickups.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Next Pickup
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-mono text-sm text-gray-600">
              {pendingPickups[0].id?.slice(0, 8)}...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Outlet:{" "}
              {pendingPickups[0].outlet?.name || pendingPickups[0].outlet_id}
            </p>
            <Link
              href="/driver/pickups"
              className="text-sm text-primary-600 hover:underline mt-2 inline-block"
            >
              View all pickups →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
