"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import StatCard from "@/components/ui/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import Badge from "@/components/ui/badge";

export default function SuperAdminDashboard() {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/api/admin/users").then((r) => r.data),
    retry: false,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["admin-outlets"],
    queryFn: () => api.get("/api/outlets").then((r) => r.data),
    retry: false,
  });

  const { data: itemsData } = useQuery({
    queryKey: ["admin-items"],
    queryFn: () => api.get("/api/items").then((r) => r.data),
    retry: false,
  });

  const users = usersData?.data ?? [];
  const outlets = outletsData?.data ?? [];
  const items = itemsData?.data ?? [];

  const roleBreakdown = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          System overview and management
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={users.length}
          icon={<span className="text-xl">👥</span>}
        />
        <StatCard
          label="Outlets"
          value={outlets.length}
          icon={<span className="text-xl">🏪</span>}
        />
        <StatCard
          label="Items"
          value={items.length}
          icon={<span className="text-xl">🧴</span>}
        />
        <StatCard
          label="Roles"
          value={Object.keys(roleBreakdown).length}
          icon={<span className="text-xl">🔑</span>}
        />
      </div>

      <Card>
        <CardHeader>Users by Role</CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(roleBreakdown).map(([role, count]) => (
            <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {count as number}
              </p>
              <p className="text-xs text-gray-500 capitalize mt-1">
                {role.replace("_", " ")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>Recent Users</CardHeader>
          <div className="space-y-2">
            {users.slice(0, 5).map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Badge variant="outline">{user.role.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>Outlets</CardHeader>
          <div className="space-y-2">
            {outlets.slice(0, 5).map((outlet: any) => (
              <div
                key={outlet.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {outlet.name}
                  </p>
                  <p className="text-xs text-gray-500">{outlet.address}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
