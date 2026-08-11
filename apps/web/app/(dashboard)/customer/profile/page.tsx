"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Ref to the hidden file input — we click it programmatically when the button is pressed
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — initialized with current user data
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  // ── Profile update mutation ──
  // Sends updated name/phone to the server
  const updateMutation = useMutation({
    mutationFn: () => api.put("/api/me", { name, phone }),
    onSuccess: () => {
      addToast({ type: "success", title: "Profile updated" });
      // Refresh the "me" query so the sidebar/header show the new name
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  // ── Avatar upload mutation ──
  // Sends the file as multipart/form-data (required for file uploads)
  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file); // "avatar" must match the backend middleware field name
      return api.post("/api/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Avatar updated" });
      // Refresh the "me" query so the new avatar shows everywhere
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  // When user selects a file, immediately start uploading
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your account settings"
      />

      {/* ── Avatar Section ── */}
      <Card>
        <CardHeader>Profile Photo</CardHeader>
        <div className="flex items-center gap-4">
          {/* Current avatar — shows image or initials */}
          <Avatar src={user?.image} name={user?.name} size="lg" />

          <div>
            {/* Hidden file input — the button below triggers it */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              loading={avatarMutation.isPending}
            >
              Change Photo
            </Button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 5MB</p>
          </div>
        </div>
      </Card>

      {/* ── Personal Info Section ── */}
      <Card>
        <CardHeader>Personal Information</CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            value={user?.email || ""}
            disabled
            hint="Email cannot be changed"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Password Reset Section ── */}
      <Card>
        <CardHeader>Change Password</CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            api
              .post("/api/reset-password-request", { email: user?.email })
              .then(() =>
                addToast({
                  type: "success",
                  title: "Password reset email sent",
                }),
              )
              .catch((err) =>
                addToast({
                  type: "error",
                  title: "Failed",
                  message: err.response?.data?.message,
                }),
              );
          }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600">
            We&apos;ll send a password reset link to your email.
          </p>
          <div className="flex justify-end">
            <Button type="submit" variant="outline">
              Send Reset Link
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
