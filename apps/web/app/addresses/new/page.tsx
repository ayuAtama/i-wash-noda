"use client";

import { CustomerShell } from "@/components/customer/customer-shell";
import { AddressForm } from "@/components/customer/address-form";
import { RequireAuth } from "@/lib/auth/guards";

export default function NewAddressPage() {
  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-5 text-xl font-bold">Tambah Alamat</h1>
          <AddressForm />
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
