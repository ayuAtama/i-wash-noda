"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Badge from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formOutletId, setFormOutletId] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/api/admin/users").then((r) => r.data),
    retry: false,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["admin-outlets"],
    queryFn: () => api.get("/api/outlets").then((r) => r.data),
    retry: false,
  });

  const users = (usersData?.data ?? []).filter(
    (u: any) => !roleFilter || u.role === roleFilter,
  );
  const outlets = outletsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/admin/register", {
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        outlet_id: formOutletId ? Number(formOutletId) : undefined,
      }),
    onSuccess: () => {
      addToast({ type: "success", title: "User created" });
      setShowCreate(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
    mutationFn: (id: string) => api.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      addToast({ type: "success", title: "User deleted" });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("");
    setFormOutletId("");
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage system users"
        action={
          <Button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
          >
            Create User
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: "", label: "All Roles" },
            { value: "outlet_admin", label: "Outlet Admin" },
            { value: "worker", label: "Worker" },
            { value: "driver", label: "Driver" },
            { value: "customer", label: "Customer" },
            { value: "super_admin", label: "Super Admin" },
          ]}
          placeholder="Filter by role"
        />
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users found"
          description="No users match the current filter."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Outlet</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        user.role === "super_admin"
                          ? "danger"
                          : user.role === "outlet_admin"
                            ? "primary"
                            : "default"
                      }
                    >
                      {user.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {user.outlet_id || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(user.id)}
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create User"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
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
            label="Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            required
            minLength={8}
          />
          <Select
            label="Role"
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
            options={[
              { value: "outlet_admin", label: "Outlet Admin" },
              { value: "worker", label: "Worker" },
              { value: "driver", label: "Driver" },
            ]}
            required
          />
          {formRole === "outlet_admin" || formRole === "worker" ? (
            <Select
              label="Outlet"
              value={formOutletId}
              onChange={(e) => setFormOutletId(e.target.value)}
              options={outlets.map((o: any) => ({
                value: String(o.id),
                label: o.name,
              }))}
            />
          ) : null}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete User"
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
