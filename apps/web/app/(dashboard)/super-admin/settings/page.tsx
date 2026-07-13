"use client";

import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="System Settings"
        description="Platform configuration"
      />

      <Card>
        <CardHeader>Platform</CardHeader>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Platform Name</span>
            <span className="font-medium">I-Wash-Noda</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">API URL</span>
            <span className="font-mono text-xs">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Version</span>
            <span>1.0.0</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>Payment Configuration</CardHeader>
        <p className="text-sm text-gray-500">
          Payment settings can be configured through the API. Contact the
          development team for changes.
        </p>
      </Card>

      <Card>
        <CardHeader>Email Configuration</CardHeader>
        <p className="text-sm text-gray-500">
          Email templates and SMTP settings are managed server-side.
        </p>
      </Card>
    </div>
  );
}
