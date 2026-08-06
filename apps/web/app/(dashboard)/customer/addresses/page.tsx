"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import Avatar from "@/components/ui/avatar";

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get("/api/addresses").then((r) => r.data),
    retry: false,
  });

  const addresses = data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        label,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
      };
      if (editingId) return api.put(`/api/addresses/${editingId}`, payload);
      return api.post("/api/addresses", payload);
    },
    onSuccess: () => {
      addToast({
        type: "success",
        title: editingId ? "Address updated" : "Address added",
      });
      setShowModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
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
    mutationFn: (id: string) => api.delete(`/api/addresses/${id}`),
    onSuccess: () => {
      addToast({ type: "success", title: "Address deleted" });
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/addresses/${id}/set-default`),
    onSuccess: () => {
      addToast({ type: "success", title: "Default address set" });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const resetForm = () => {
    setLabel("");
    setAddress("");
    setLatitude("");
    setLongitude("");
    setEditingId(null);
  };

  const openEdit = (addr: any) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setAddress(addr.address);
    setLatitude(String(addr.latitude || ""));
    setLongitude(String(addr.longitude || ""));
    setShowModal(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="My Addresses"
        description="Manage your saved addresses"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Add Address
          </Button>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No addresses"
          description="Add an address to use for pickups."
        />
      ) : (
        <div className="space-y-4">
          {addresses.map((addr: any) => (
            <Card key={addr.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={addr.label} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{addr.label}</p>
                      {addr.is_default && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{addr.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!addr.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(addr.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(addr)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingId(addr.id)}
                    className="text-danger-600 hover:text-danger-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Address" : "Add Address"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Home, Office..."
            required
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="-6.2088"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="106.8456"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingId ? "Save Changes" : "Add Address"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Address"
        message="Are you sure you want to delete this address?"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
