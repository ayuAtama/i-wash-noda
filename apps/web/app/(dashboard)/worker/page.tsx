"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import StatCard from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";

export default function WorkerDashboard() {
  const { user } = useAuth();

  const { data: availableData, isLoading } = useQuery({
    queryKey: ["worker-available"],
    queryFn: () => api.get("/api/worker/orders/available").then((r) => r.data),
    retry: false,
  });

  const { data: historyData } = useQuery({
    queryKey: ["worker-history"],
    queryFn: () => api.get("/api/worker/orders/history").then((r) => r.data),
    retry: false,
  });

  const available = availableData?.data ?? [];
  const history = historyData?.data ?? [];

  const stationLabel: Record<string, string> = {
    washing: "Washing Station",
    ironing: "Ironing Station",
    packing: "Packing Station",
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {stationLabel[user?.worker_station || "washing"]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Available Orders"
          value={available.length}
          icon={<span className="text-xl">📋</span>}
        />
        <StatCard
          label="Completed Today"
          value={history.length}
          icon={<span className="text-xl">✅</span>}
        />
        <StatCard
          label="Station"
          value={
            user?.worker_station?.charAt(0).toUpperCase() +
            (user?.worker_station?.slice(1) || "")
          }
          icon={<span className="text-xl">⚙️</span>}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/worker/available">
          <Button>View Available Orders</Button>
        </Link>
        <Link href="/worker/in-progress">
          <Button variant="outline">In Progress</Button>
        </Link>
        <Link href="/worker/history">
          <Button variant="ghost">History</Button>
        </Link>
      </div>

      {available.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Next Available Order
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-mono text-sm text-gray-600">
              Order {available[0].id?.slice(0, 8)}...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {available[0].items?.length ?? 0} items
            </p>
            <Link
              href="/worker/available"
              className="text-sm text-primary-600 hover:underline mt-2 inline-block"
            >
              View all available →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
