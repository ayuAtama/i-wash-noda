"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export default function OutletsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-outlets"],
    queryFn: () => api.get("/api/outlets").then((r) => r.data),
    retry: false,
  });

  const outlets = data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: formName,
        address: formAddress,
        phone: formPhone,
        latitude: Number(formLat),
        longitude: Number(formLng),
        coverage_radius_km: Number(formRadius),
      };
      if (editingId) return api.put(`/api/outlets/${editingId}`, payload);
      return api.post("/api/outlets", payload);
    },
    onSuccess: () => {
      addToast({
        type: "success",
        title: editingId ? "Outlet updated" : "Outlet created",
      });
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-outlets"] });
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
    mutationFn: (id: number) => api.delete(`/api/outlets/${id}`),
    onSuccess: () => {
      addToast({ type: "success", title: "Outlet deleted" });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-outlets"] });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormAddress("");
    setFormPhone("");
    setFormLat("");
    setFormLng("");
    setFormRadius("");
    setEditingId(null);
  };

  const openEdit = (outlet: any) => {
    setEditingId(outlet.id);
    setFormName(outlet.name);
    setFormAddress(outlet.address);
    setFormPhone(outlet.phone);
    setFormLat(String(outlet.latitude || ""));
    setFormLng(String(outlet.longitude || ""));
    setFormRadius(String(outlet.coverage_radius_km || ""));
    setShowForm(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Outlet Management"
        description="Manage laundry outlets"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Create Outlet
          </Button>
        }
      />

      {outlets.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No outlets"
          description="Create your first outlet."
          action={
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Create Outlet
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet: any) => (
            <Card key={outlet.id}>
              <CardHeader>{outlet.name}</CardHeader>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">{outlet.address}</p>
                <p className="text-gray-500">📞 {outlet.phone || "N/A"}</p>
                <p className="text-gray-500">
                  Coverage: {outlet.coverage_radius_km} km
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(outlet)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(outlet.id)}
                    className="text-danger-600"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Outlet" : "Create Outlet"}
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
          <Input
            label="Address"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            required
          />
          <Input
            label="Phone"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formLat}
              onChange={(e) => setFormLat(e.target.value)}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={formLng}
              onChange={(e) => setFormLng(e.target.value)}
            />
          </div>
          <Input
            label="Coverage Radius (km)"
            type="number"
            step="0.1"
            value={formRadius}
            onChange={(e) => setFormRadius(e.target.value)}
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
        title="Delete Outlet"
        message="This will permanently delete this outlet."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
