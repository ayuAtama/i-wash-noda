"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import { Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker, type LatLng } from "@/components/customer/location-picker";
import { FieldError } from "@/components/auth/form-field";
import {
  useCreateAddress,
  useUpdateAddress,
} from "@/lib/api/queries";
import type { Address } from "@/lib/api/types";
import { useGeolocation } from "@/hooks/use-geolocation";
import { geocodeAddress } from "@/lib/location/actions";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().trim().min(1, "Label wajib diisi").max(50, "Maksimal 50 karakter"),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(500, "Maksimal 500 karakter"),
  isDefault: z.boolean(),
});

const LABEL_CHOICES = ["Rumah", "Kantor", "Kos", "Lainnya"];

export function AddressForm({ address }: { address?: Address }) {
  const router = useRouter();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const { position, error, loading, locate } = useGeolocation();

  const [coords, setCoords] = useState<LatLng | null>(
    address ? { lat: address.lat, lng: address.lng } : null,
  );
  const [coordsError, setCoordsError] = useState<string | null>(null);

  useEffect(() => {
    if (position) setCoords(position);
  }, [position]);

  const form = useForm({
    defaultValues: {
      label: address?.label ?? "",
      address: address?.address ?? "",
      isDefault: address?.is_default ?? false,
    },
    validators: { onSubmit: addressSchema },
    onSubmit: ({ value }) => {
      if (!coords) {
        setCoordsError("Pilih titik lokasi pada peta atau gunakan lokasi saat ini.");
        return;
      }
      const payload = { ...value, lat: coords.lat, lng: coords.lng };
      const onDone = () => {
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next && next.startsWith("/") ? next : "/addresses");
      };
      if (address) {
        updateAddress.mutate({ id: address.id, ...payload }, { onSuccess: onDone });
      } else {
        createAddress.mutate(payload, { onSuccess: onDone });
      }
    },
  });

  const isPending = createAddress.isPending || updateAddress.isPending;
  const fieldLabel = useStore(form.store, (s) => s.values.label);
  const fieldAddress = useStore(form.store, (s) => s.values.address);
  const fieldIsDefault = useStore(form.store, (s) => s.values.isDefault);

  async function handleGeocode() {
    const raw = form.getFieldValue("address") ?? "";
    if (!raw.trim()) return;
    setCoordsError(null);
    const result = await geocodeAddress(raw);
    if (result) {
      setCoords({ lat: result.lat, lng: result.lng });
    } else {
      setCoordsError("Lokasi tidak ditemukan. Coba periksa kembali alamatnya.");
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="space-y-1.5">
        <Label>Label alamat</Label>
        <div className="flex flex-wrap gap-2">
          {LABEL_CHOICES.map((choice) => (
            <Button
              key={choice}
              type="button"
              size="sm"
              variant={fieldLabel === choice ? "default" : "outline"}
              onClick={() => form.setFieldValue("label", choice)}
            >
              {choice}
            </Button>
          ))}
        </div>
        <Input
          value={fieldLabel}
          onChange={(e) => form.setFieldValue("label", e.target.value)}
          placeholder="atau tulis label lain"
        />
        <FieldError errors={form.state.fieldMeta.label?.errors ?? []} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Alamat lengkap</Label>
        <Textarea
          id="address"
          rows={3}
          value={fieldAddress}
          onChange={(e) => form.setFieldValue("address", e.target.value)}
          placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota"
        />
        <FieldError errors={form.state.fieldMeta.address?.errors ?? []} />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleGeocode}>
            Cari di peta
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={locate} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="mr-1 h-3.5 w-3.5" />}
            Gunakan lokasi saat ini
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Titik lokasi di peta</Label>
        <div className="overflow-hidden rounded-lg border">
          <LocationPicker value={coords} onChange={(pos) => { setCoords(pos); setCoordsError(null); }} height={240} />
        </div>
        {coords ? (
          <p className="text-xs text-muted-foreground">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {coordsError ? <p className="text-xs text-destructive">{coordsError}</p> : null}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Jadikan alamat utama</p>
          <p className="text-xs text-muted-foreground">
            Alamat utama digunakan sebagai default saat memesan jemputan.
          </p>
        </div>
        <Switch
          checked={fieldIsDefault}
          onCheckedChange={(checked) => form.setFieldValue("isDefault", checked)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {address ? "Simpan perubahan" : "Simpan alamat"}
      </Button>
    </form>
  );
}
