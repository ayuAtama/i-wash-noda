"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navByRole: Record<string, NavItem[]> = {
  customer: [
    { label: "Dashboard", href: "/customer", icon: "🏠" },
    { label: "Orders", href: "/customer/orders", icon: "📦" },
    { label: "Pickup Requests", href: "/customer/pickup-requests", icon: "🚚" },
    { label: "Addresses", href: "/customer/addresses", icon: "📍" },
    { label: "Profile", href: "/customer/profile", icon: "👤" },
  ],
  outlet_admin: [
    { label: "Dashboard", href: "/outlet-admin", icon: "🏠" },
    { label: "Walk-in Customers", href: "/outlet-admin/walk-ins", icon: "🧑" },
    { label: "Orders", href: "/outlet-admin/orders", icon: "📦" },
    { label: "Payments", href: "/outlet-admin/payments", icon: "💳" },
    { label: "Mismatches", href: "/outlet-admin/mismatches", icon: "⚠️" },
    { label: "Profile", href: "/outlet-admin/profile", icon: "🏪" },
  ],
  worker: [
    { label: "Dashboard", href: "/worker", icon: "🏠" },
    { label: "Available Orders", href: "/worker/available", icon: "📋" },
    { label: "In Progress", href: "/worker/in-progress", icon: "⚙️" },
    { label: "History", href: "/worker/history", icon: "📜" },
  ],
  driver: [
    { label: "Dashboard", href: "/driver", icon: "🏠" },
    { label: "Pickups", href: "/driver/pickups", icon: "📦" },
    { label: "Deliveries", href: "/driver/deliveries", icon: "🚚" },
  ],
  super_admin: [
    { label: "Dashboard", href: "/super-admin", icon: "🏠" },
    { label: "Users", href: "/super-admin/users", icon: "👥" },
    { label: "Outlets", href: "/super-admin/outlets", icon: "🏪" },
    { label: "Items", href: "/super-admin/items", icon: "🧴" },
    { label: "Schedule", href: "/super-admin/schedule", icon: "📅" },
    { label: "Settings", href: "/super-admin/settings", icon: "⚙️" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = navByRole[user?.role || "customer"] || [];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-lg shadow-md p-2 border border-gray-200"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
          ${collapsed ? "w-[72px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                IW
              </div>
              <span className="font-bold text-gray-900">I-Wash-Noda</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto">
              IW
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${user?.role?.replace("_", "-")}` &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className="hidden lg:block px-2 pb-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <Avatar src={user?.image} name={user?.name} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Logout"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
