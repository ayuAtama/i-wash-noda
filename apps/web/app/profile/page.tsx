"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Mail, Shield, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/shared/OtpInput";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { FieldError } from "@/components/auth/form-field";
import { authApi } from "@/lib/api/endpoints";
import {
  useChangeEmailConfirm,
  useChangeEmailRequest,
  useLogout,
  useUpdateMe,
} from "@/lib/api/queries";
import { RequireAuth } from "@/lib/auth/guards";
import { setSession, setUnauthenticated, useSession } from "@/lib/auth/session-store";
import { normalizeError } from "@/lib/api/client";
import { labelFrom, ROLE_LABEL, formatDate } from "@/lib/utils";

const NameSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
});

const PasswordSchema = z
  .object({
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const updateMe = useUpdateMe();
  const changeEmailRequest = useChangeEmailRequest();
  const changeEmailConfirm = useChangeEmailConfirm();
  const logout = useLogout();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStage, setOtpStage] = useState(false);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    retry: false,
  });

  const nameForm = useForm({
    defaultValues: { name: session.user?.name ?? "" },
    validators: { onSubmit: NameSchema },
    onSubmit: async ({ value }) => {
      updateMe.mutate(
        { name: value.name },
        {
          onSuccess: () => {
            if (session.user) {
              setSession({ ...session.user, name: value.name });
            }
            toast.success("Nama berhasil diperbarui");
          },
        },
      );
    },
  });

  const passwordForm = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: PasswordSchema },
    onSubmit: async ({ value }) => {
      updateMe.mutate(
        { password: value.password },
        {
          onSuccess: () => {
            toast.success("Kata sandi berhasil diubah");
            passwordForm.reset();
          },
        },
      );
    },
  });

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        setUnauthenticated();
        router.replace("/login");
      },
    });
  }

  const user = session.user;

  return (
    <RequireAuth>
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Profil Saya</h1>

        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="h-16 w-16">
              {(avatarUrl ?? user?.image) ? (
                <AvatarImage
                  src={avatarUrl ?? user?.image ?? ""}
                  alt={user?.name ?? ""}
                />
              ) : null}
              <AvatarFallback className="text-lg">
                {(user?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user?.name ?? "-"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-medium">{me.data?.data.email ?? user?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Peran</span>
              <span className="ml-auto font-medium">
                {user ? labelFrom(ROLE_LABEL, user.role) : "-"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Bergabung</span>
              <span className="ml-auto font-medium">
                {formatDate(me.data?.data["created at"], false)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Foto Profil</CardTitle>
            <CardDescription>
              Unggah foto untuk profil Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              folder="avatars"
              value={avatarUrl ?? user?.image}
              onUploaded={(url) => {
                setAvatarUrl(url);
                toast.success("Foto berhasil diunggah");
              }}
              label="Pilih foto"
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ubah Nama</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void nameForm.handleSubmit();
              }}
            >
              <nameForm.Field name="name">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nama lengkap</Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </nameForm.Field>
              <Button type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? "Menyimpan…" : "Simpan nama"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ubah Kata Sandi</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void passwordForm.handleSubmit();
              }}
            >
              <passwordForm.Field name="password">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Kata sandi baru</Label>
                    <Input
                      id="password"
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      autoComplete="new-password"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </passwordForm.Field>
              <passwordForm.Field name="confirmPassword">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Konfirmasi kata sandi</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      autoComplete="new-password"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </passwordForm.Field>
              <Button type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? "Menyimpan…" : "Ubah kata sandi"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ubah Email</CardTitle>
            <CardDescription>
              Verifikasi email baru Anda sebelum diganti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpStage ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="newEmail">Email baru</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email-baru@email.com"
                  />
                </div>
                <Button
                  disabled={!newEmail || changeEmailRequest.isPending}
                  onClick={() => {
                    changeEmailRequest.mutate(
                      { email: newEmail },
                      {
                        onSuccess: () => {
                          setOtpStage(true);
                          toast.success("Kode verifikasi terkirim");
                        },
                        onError: (err) => toast.error(normalizeError(err).message),
                      },
                    );
                  }}
                >
                  {changeEmailRequest.isPending ? "Mengirim…" : "Kirim kode"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Masukkan kode verifikasi</Label>
                  <OtpInput value={otp} onChange={setOtp} disabled={changeEmailConfirm.isPending} />
                  <p className="text-xs text-muted-foreground">
                    Kode dikirim ke {newEmail}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={otp.length !== 6 || changeEmailConfirm.isPending}
                    onClick={() => {
                      changeEmailConfirm.mutate(
                        { email: newEmail, token: otp },
                        {
                          onSuccess: () => {
                            setOtpStage(false);
                            setOtp("");
                            setNewEmail("");
                            toast.success("Email berhasil diubah");
                            void me.refetch();
                            if (user) {
                              setSession({ ...user, email: newEmail });
                            }
                          },
                        },
                      );
                    }}
                  >
                    {changeEmailConfirm.isPending ? "Memverifikasi…" : "Konfirmasi"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setOtpStage(false);
                      setOtp("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Button variant="destructive" className="w-full" onClick={handleLogout} disabled={logout.isPending}>
          {logout.isPending ? "Keluar…" : "Keluar"}
        </Button>
      </main>
    </RequireAuth>
  );
}
