"use client";

import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { user } = useAuth();

  const roleLabel: Record<string, string> = {
    customer: "Customer",
    outlet_admin: "Outlet Admin",
    worker: "Worker",
    driver: "Driver",
    super_admin: "Super Admin",
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:pl-72">
      <div className="lg:hidden w-8" />
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {roleLabel[user?.role || "customer"]} Portal
        </span>
      </div>
    </header>
  );
}
