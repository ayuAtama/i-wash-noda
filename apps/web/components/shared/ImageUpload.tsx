"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cloudinaryApi } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/client";
import type { CloudinaryFolder } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ImageUpload({
  folder,
  onUploaded,
  value,
  label = "Unggah gambar",
  aspectSquare = true,
}: {
  folder: CloudinaryFolder;
  onUploaded: (url: string) => void;
  value?: string | null;
  label?: string;
  aspectSquare?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    try {
      const sigRes = await cloudinaryApi.signature(folder);
      const sig = sigRes.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      formData.append("public_id", sig.public_id);
      formData.append("overwrite", String(sig.overwrite));
      formData.append("allowed_formats", sig.allowed_formats.join(","));

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Upload gagal");
      }

      const data = (await res.json()) as { secure_url?: string };
      if (!data.secure_url) throw new Error("URL gambar tidak ditemukan");

      onUploaded(data.secure_url);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <div
        className={cn(
          "relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-6 transition-colors hover:border-primary/50",
          aspectSquare && "aspect-square max-w-64",
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Pratinjau"
              fill
              className="absolute inset-0 rounded-lg object-cover"
              sizes="(max-width: 256px) 100vw, 256px"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => onUploaded("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-2 text-muted-foreground disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm font-medium">{uploading ? "Mengunggah…" : label}</span>
              </>
            )}
          </button>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {value && !uploading ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Ganti gambar
        </Button>
      ) : null}
    </div>
  );
}
