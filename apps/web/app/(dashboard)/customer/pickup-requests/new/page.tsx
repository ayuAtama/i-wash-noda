"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Select from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";

interface ItemEntry {
  itemId: string;
  quantity: number;
}

export default function NewPickupRequestPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [outletId, setOutletId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemEntry[]>([
    { itemId: "", quantity: 1 },
  ]);

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => api.get("/api/outlets").then((r) => r.data),
    retry: false,
  });

  const { data: itemsData } = useQuery({
    queryKey: ["items"],
    queryFn: () => api.get("/api/items").then((r) => r.data),
    retry: false,
  });

  const outlets = outletsData?.data ?? [];
  const availableItems = itemsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/pickup-requests", {
        outlet_id: Number(outletId),
        pickup_date: pickupDate,
        pickup_time_slot: timeSlot,
        notes,
        items: items
          .filter((i) => i.itemId)
          .map((i) => ({
            item_id: i.itemId,
            quantity: i.quantity,
          })),
      }),
    onSuccess: () => {
      addToast({ type: "success", title: "Pickup request created" });
      router.push("/customer/pickup-requests");
    },
    onError: (err: any) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  const addItem = () => setItems([...items, { itemId: "", quantity: 1 }]);
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof ItemEntry, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="New Pickup Request"
        description="Schedule a laundry pickup"
        breadcrumbs={[
          { label: "Pickup Requests", href: "/customer/pickup-requests" },
          { label: "New" },
        ]}
      />

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-6"
        >
          <Select
            label="Outlet"
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            options={outlets.map((o: any) => ({
              value: String(o.id),
              label: o.name,
            }))}
            placeholder="Select an outlet"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pickup Date"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
            />
            <Select
              label="Time Slot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              options={[
                { value: "09:00-12:00", label: "Morning (9-12)" },
                { value: "12:00-15:00", label: "Afternoon (12-3)" },
                { value: "15:00-18:00", label: "Evening (3-6)" },
              ]}
              placeholder="Select time"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items
            </label>
            <div className="space-y-3">
              {items.map((entry, i) => (
                <div key={i} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Select
                      value={entry.itemId}
                      onChange={(e) => updateItem(i, "itemId", e.target.value)}
                      options={availableItems.map((it: any) => ({
                        value: it.id,
                        label: `${it.name} - ${it.unit}`,
                      }))}
                      placeholder="Select item"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      value={entry.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", Number(e.target.value))
                      }
                      placeholder="Qty"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(i)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addItem}
              className="mt-2"
            >
              + Add Item
            </Button>
          </div>

          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
          />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!outletId || !pickupDate || !timeSlot}
            >
              Create Pickup Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
