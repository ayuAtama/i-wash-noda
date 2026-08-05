"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Card, CardHeader } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";

export default function NewWalkInPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState<"customer" | "items">("customer");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<{ itemId: string; quantity: number }[]>([
    { itemId: "", quantity: 1 },
  ]);

  const { data: itemsData } = useQuery({
    queryKey: ["items"],
    queryFn: () => api.get("/api/items").then((r) => r.data),
    retry: false,
  });
  const availableItems = itemsData?.data ?? [];

  const createCustomer = useMutation({
    mutationFn: () =>
      api
        .post("/api/walk-in-customer", {
          name,
          phone,
          email: email || undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setCustomerId(data.data?.id || data.id);
      setStep("items");
    },
    onError: (err: any) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  const createOrder = useMutation({
    mutationFn: () =>
      api.post("/api/walk-in-customer/orders", {
        walk_in_customer_id: customerId,
        items: items
          .filter((i) => i.itemId)
          .map((i) => ({ item_id: i.itemId, quantity: i.quantity })),
      }),
    onSuccess: () => {
      addToast({ type: "success", title: "Walk-in order created" });
      router.push("/outlet-admin/orders");
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
  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="New Walk-in Customer"
        description={
          step === "customer" ? "Step 1: Customer info" : "Step 2: Add items"
        }
        breadcrumbs={[
          { label: "Walk-ins", href: "/outlet-admin/walk-ins" },
          { label: "New" },
        ]}
      />

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        <div
          className={`flex-1 h-1 rounded-full ${step === "customer" ? "bg-primary-600" : "bg-primary-600"}`}
        />
        <div
          className={`flex-1 h-1 rounded-full ${step === "items" ? "bg-primary-600" : "bg-gray-200"}`}
        />
      </div>

      <Card>
        {step === "customer" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCustomer.mutate();
            }}
            className="space-y-4"
          >
            <Input
              label="Customer Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+628123456789"
            />
            <Input
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createCustomer.isPending}>
                Continue
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Customer: <strong>{name}</strong> ({phone})
            </p>
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
            <Button variant="ghost" size="sm" onClick={addItem}>
              + Add Item
            </Button>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setStep("customer")}>
                Back
              </Button>
              <Button
                onClick={() => createOrder.mutate()}
                loading={createOrder.isPending}
                disabled={items.every((i) => !i.itemId)}
              >
                Create Order
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
