"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PageSpinner } from "@/components/ui/spinner";

const dashboards: Record<string, string> = {
  customer: "/customer",
  outlet_admin: "/outlet-admin",
  worker: "/worker",
  driver: "/driver",
  super_admin: "/super-admin",
};

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(dashboards[user.role] || "/customer");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <PageSpinner />
    </div>
  );
}
