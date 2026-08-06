"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/ui/select";
import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [outletId, setOutletId] = useState("");
  const [station, setStation] = useState("washing");
  const [workerId, setWorkerId] = useState("");
  const [shiftStart, setShiftStart] = useState("08:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ["admin-schedule", date],
    queryFn: () =>
      api.get(`/api/admin/schedule?date=${date}`).then((r) => r.data),
    retry: false,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["admin-outlets"],
    queryFn: () => api.get("/api/outlets").then((r) => r.data),
    retry: false,
  });

  const { data: workersData } = useQuery({
    queryKey: ["admin-schedule-workers", station, date],
    queryFn: () =>
      api
        .get(`/api/admin/schedule/${station}?date=${date}`)
        .then((r) => r.data),
    retry: false,
  });

  const { data: noShiftData } = useQuery({
    queryKey: ["admin-schedule-no-shift", date],
    queryFn: () =>
      api
        .get(`/api/admin/schedule/no-shift-workers?date=${date}`)
        .then((r) => r.data),
    retry: false,
  });

  const schedules = scheduleData?.data ?? [];
  const outlets = outletsData?.data ?? [];
  const workers = workersData?.data ?? [];
  const noShiftWorkers = noShiftData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/admin/schedule", {
        worker_id: workerId,
        outlet_id: Number(outletId),
        date,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        station,
      }),
    onSuccess: () => {
      addToast({ type: "success", title: "Shift created" });
      queryClient.invalidateQueries({ queryKey: ["admin-schedule"] });
    },
    onError: (err: any) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Schedule Management"
        description="Manage worker shifts"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Shift Form */}
        <Card className="lg:col-span-1">
          <CardHeader>Create Shift</CardHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Outlet"
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              options={outlets.map((o: any) => ({
                value: String(o.id),
                label: o.name,
              }))}
              required
            />
            <Select
              label="Station"
              value={station}
              onChange={(e) => setStation(e.target.value)}
              options={[
                { value: "washing", label: "Washing" },
                { value: "ironing", label: "Ironing" },
                { value: "packing", label: "Packing" },
                { value: "driver", label: "Driver" },
              ]}
            />
            <Select
              label="Worker"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              options={workers.map((w: any) => ({
                value: w.id,
                label: w.name || w.email,
              }))}
              placeholder="Select worker"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              loading={createMutation.isPending}
              disabled={!outletId || !workerId}
            >
              Create Shift
            </Button>
          </form>
        </Card>

        {/* Schedule View */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardHeader>Schedule for {date}</CardHeader>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
            </div>

            {schedules.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No shifts scheduled"
                description="Create a shift using the form."
              />
            ) : (
              <div className="space-y-2">
                {schedules.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {s.worker?.name || s.worker_id}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {s.station} · {s.outlet?.name || s.outlet_id}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {s.shift_start} - {s.shift_end}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {noShiftWorkers.length > 0 && (
            <Card>
              <CardHeader>Workers Without Shifts</CardHeader>
              <div className="space-y-2">
                {noShiftWorkers.map((w: any) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="text-sm text-gray-700">{w.name || w.email}</p>
                    <span className="text-xs text-gray-400">No shift</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
