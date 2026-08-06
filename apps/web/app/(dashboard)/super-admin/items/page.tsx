"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Badge from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formUnit, setFormUnit] = useState("kg");
  const [formCategory, setFormCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-items", search],
    queryFn: () => {
      if (search)
        return api
          .get(`/api/items/search?q=${encodeURIComponent(search)}`)
          .then((r) => r.data);
      return api.get("/api/items").then((r) => r.data);
    },
    retry: false,
  });

  const items = data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: formName,
        description: formDesc,
        price: Number(formPrice),
        unit: formUnit,
        category: formCategory,
      };
      if (editingId) return api.put(`/api/items/${editingId}`, payload);
      return api.post("/api/items", payload);
    },
    onSuccess: () => {
      addToast({
        type: "success",
        title: editingId ? "Item updated" : "Item created",
      });
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
    onError: (err: any) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/items/${id}`),
    onSuccess: () => {
      addToast({ type: "success", title: "Item deleted" });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormUnit("kg");
    setFormCategory("");
    setEditingId(null);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormPrice(String(item.price));
    setFormUnit(item.unit);
    setFormCategory(item.category || "");
    setShowForm(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Item Management"
        description="Manage laundry service items"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Create Item
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🧴"
          title="No items"
          description="Create your first item."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.category || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={item.is_active !== false ? "success" : "default"}
                    >
                      {item.is_active !== false ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(item.id)}
                      className="text-danger-600"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Item" : "Create Item"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              required
            />
            <Select
              label="Unit"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              options={[
                { value: "kg", label: "Per Kg" },
                { value: "piece", label: "Per Piece" },
              ]}
            />
          </div>
          <Input
            label="Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder="e.g. Regular, Express"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingId ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Item"
        message="This will permanently delete this item."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
