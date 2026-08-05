"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";

export default function OutletProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Outlet Profile"
        description="View your outlet details"
      />

      <Card>
        <CardHeader>Outlet Information</CardHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Outlet ID</span>
            <span className="font-mono">{user?.outlet_id || "N/A"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Admin</span>
            <span>{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Role</span>
            <span className="capitalize">{user?.role?.replace("_", " ")}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
