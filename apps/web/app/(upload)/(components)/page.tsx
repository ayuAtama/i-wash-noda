"use client";
import { useState } from "react";

export default function PaymentProofUploader({
  transactionId,
}: {
  transactionId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const signatureRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/signature/payment-proofs/${transactionId}`,
        { credentials: "include" },
      );

      if (!signatureRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { data: signData } = await signatureRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", signData.timestamp.toString());
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);
      formData.append("public_id", signData.public_id);
      formData.append("allowed_formats", "jpg,png,jpeg,pdf");
      formData.append("overwrite", "true");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`,
        { method: "POST", body: formData },
      );

      const cloudinaryResponse = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(cloudinaryResponse.error?.message || "Upload failed");
      }

      setUploadedUrl(cloudinaryResponse.secure_url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload payment proof.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload Proof"}
      </button>
      {uploadedUrl && <p>Upload successful! URL: {uploadedUrl}</p>}
    </div>
  );
}
