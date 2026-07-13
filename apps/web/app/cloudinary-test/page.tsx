"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface MeResponse {
  success: boolean;
  data: { id: string; name: string; email: string; image: string | null };
}

function fetchMe(): Promise<MeResponse> {
  return api.get("/api/me").then((r) => r.data);
}

export default function CloudinaryTestPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const user = data?.data;
  const avatarUrl = preview ?? user?.image ?? null;

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return api.post("/api/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res) => {
      const newUrl = res.data?.data?.image;
      if (newUrl) setPreview(newUrl);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete("/api/me/avatar"),
    onSuccess: () => {
      setPreview(null);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
        <p>
          Please <a href="/login">login</a> first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Cloudinary Avatar Test
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Test upload and delete avatar via <code>POST /api/me/avatar</code> and{" "}
        <code>DELETE /api/me/avatar</code>.
      </p>

      {/* Avatar preview */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Current Avatar
        </h2>
        {isFetching ? (
          <p style={{ color: "#9ca3af" }}>Loading...</p>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={{
              width: 128,
              height: 128,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #e5e7eb",
            }}
          />
        ) : (
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 14,
              border: "2px dashed #d1d5db",
            }}
          >
            No avatar
          </div>
        )}
      </section>

      {/* Upload */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Upload Avatar
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ fontSize: 14 }}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #3b82f6",
              backgroundColor:
                !selectedFile || uploadMutation.isPending
                  ? "#bfdbfe"
                  : "#eff6ff",
              color: "#1d4ed8",
              cursor:
                !selectedFile || uploadMutation.isPending
                  ? "not-allowed"
                  : "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </button>
        </div>
        <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 6 }}>
          Accepted: JPEG, PNG, WEBP. Max 5MB.
        </p>
        {uploadMutation.isError && (
          <p style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }}>
            Error: {uploadMutation.error.message}
          </p>
        )}
        {uploadMutation.isSuccess && (
          <p style={{ color: "#22c55e", marginTop: 8, fontSize: 13 }}>
            Avatar uploaded successfully!
          </p>
        )}
      </section>

      {/* Delete */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Delete Avatar
        </h2>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={!avatarUrl || deleteMutation.isPending}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #ef4444",
            backgroundColor:
              !avatarUrl || deleteMutation.isPending ? "#fecaca" : "#fef2f2",
            color: "#b91c1c",
            cursor:
              !avatarUrl || deleteMutation.isPending
                ? "not-allowed"
                : "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete Avatar"}
        </button>
        {deleteMutation.isError && (
          <p style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }}>
            Error: {deleteMutation.error.message}
          </p>
        )}
        {deleteMutation.isSuccess && (
          <p style={{ color: "#22c55e", marginTop: 8, fontSize: 13 }}>
            Avatar deleted successfully!
          </p>
        )}
      </section>

      {/* Raw user data */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          User Data
        </h2>
        <pre
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 13,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(user, null, 2)}
        </pre>
      </section>
    </div>
  );
}
