"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { CustomerShell } from "@/components/customer/customer-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useCreateComplaint } from "@/lib/api/queries";

export default function ComplaintPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createComplaint = useCreateComplaint();

  const canSubmit = message.trim().length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createComplaint.mutate(
      { orderId, body: { complaintMessage: message.trim(), complaintImage: image } },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/order/complete">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali ke riwayat
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Kirim Komplain</h1>
            <p className="text-sm text-muted-foreground">
              Pesanan {orderId.slice(0, 8)} — ceritakan kendala yang Anda alami.
            </p>
          </div>

          {submitted ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <div>
                  <p className="text-lg font-bold">Komplain terkirim!</p>
                  <p className="text-sm text-muted-foreground">
                    Tim kami akan meninjau keluhan Anda dan menghubungi Anda secepatnya.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/order">Ke pesanan saya</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="complaint">Keluhan Anda</Label>
                  <Textarea
                    id="complaint"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Contoh: pakaian belum diantar, hasil cucian tidak sesuai, atau barang tertinggal."
                  />
                  {message.trim() && message.trim().length < 3 ? (
                    <p className="text-xs text-destructive">
                      Keluhan minimal 3 karakter.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label>Foto pendukung (opsional)</Label>
                  <ImageUpload
                    folder="complaints"
                    value={image}
                    onUploaded={setImage}
                    label="Unggah foto"
                    aspectSquare={false}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!canSubmit || createComplaint.isPending}
                  onClick={handleSubmit}
                >
                  {createComplaint.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Kirim komplain
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
