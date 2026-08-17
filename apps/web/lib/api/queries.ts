"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeError } from "./client";
import { useDebounce } from "@/hooks/use-debounce";
import {
  addressApi,
  adminMismatchApi,
  adminOrderApi,
  adminOutletApi,
  adminUserApi,
  adminWalkInApi,
  authApi,
  cloudinaryApi,
  customerOrderApi,
  deliveryOrderApi,
  itemApi,
  outletApi,
  pickupOrderApi,
  pickupRequestApi,
  setupApi,
  workerShiftApi,
  workerStationApi,
} from "./endpoints";

export const queryKeys = {
  me: ["me"] as const,
  outlets: ["outlets"] as const,
  outletCoverage: (lat: number, lng: number) =>
    ["outlet-coverage", lat, lng] as const,
  items: ["items"] as const,
  addresses: ["addresses"] as const,
  coverageCheck: ["pickup-requests", "coverage-check"] as const,
  pickupRequestStatus: ["pickup-requests", "status"] as const,
  customerActiveOrders: ["orders", "active"] as const,
  customerCompletedOrders: ["orders", "complete"] as const,
  pickupAvailable: ["pickup", "available"] as const,
  pickupActive: ["pickup", "active"] as const,
  pickupCompleted: ["pickup", "completed"] as const,
  deliveryAvailable: ["delivery", "available"] as const,
  deliveryActive: ["delivery", "active"] as const,
  deliveryCompleted: ["delivery", "completed"] as const,
  workerAvailable: ["worker", "available"] as const,
  workerActive: ["worker", "active"] as const,
  workerCompleted: ["worker", "completed"] as const,
  itemSearch: ["item", "search"] as const,
  adminOrders: ["admin", "orders"] as const,
  adminPaymentProofs: ["admin", "payment-proofs"] as const,
  adminComplaints: ["admin", "complaints"] as const,
  adminUsers: ["admin", "users"] as const,
  adminWalkIn: (keyword: string) => ["admin", "walk-in", keyword] as const,
  mismatchList: (station?: string) =>
    ["admin", "mismatch", "list", station ?? "all"] as const,
  mismatchDetail: (orderId: string, station: string) =>
    ["admin", "mismatch", "detail", orderId, station] as const,
  scheduleSummary: ["admin", "schedule", "summary"] as const,
  schedule: (filters: string) => ["admin", "schedule", filters] as const,
  unassignedWorkers: (keyword: string, role: string) =>
    ["admin", "schedule", "unassigned", keyword, role] as const,
};

const is404 = (error: unknown) =>
  error instanceof Error && "status" in error && (error as { status: number }).status === 404;

// ---------- Setup ----------

export function useSetupStatus() {
  return useQuery({
    queryKey: ["setup", "status"],
    queryFn: async () => {
      try {
        const res = await setupApi.status();
        return res.data.setupRequired;
      } catch (error) {
        if (is404(error)) return false;
        throw error;
      }
    },
    retry: false,
  });
}

export function useCreateSuperAdmin() {
  return useMutation({
    mutationFn: setupApi.createSuperAdmin,
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Auth ----------

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useVerify() {
  return useMutation({
    mutationFn: ({ body, query }: { body: { token?: string }; query?: { token?: string } }) =>
      authApi.verify(body, query),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useCompleteRegister() {
  return useMutation({
    mutationFn: authApi.completeRegister,
    onSuccess: () => toast.success("Registrasi berhasil"),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: authApi.resendOtp,
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useResetRequest() {
  return useMutation({
    mutationFn: authApi.resetRequest,
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useResetConfirm() {
  return useMutation({
    mutationFn: authApi.resetConfirm,
    onSuccess: () => toast.success("Kata sandi berhasil diubah"),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useUpdateMe() {
  return useMutation({
    mutationFn: authApi.updateMe,
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useChangeEmailRequest() {
  return useMutation({
    mutationFn: authApi.changeEmailRequest,
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useChangeEmailConfirm() {
  return useMutation({
    mutationFn: authApi.changeEmailConfirm,
    onSuccess: () => toast.success("Email berhasil diubah"),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useTelegramEmailRequest() {
  return useMutation({
    mutationFn: authApi.telegramEmailRequest,
    onSuccess: () =>
      toast.success("Kode verifikasi berhasil dikirim ke email Anda"),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useTelegramEmailVerify() {
  return useMutation({
    mutationFn: authApi.telegramEmailVerify,
    onSuccess: () => toast.success("Email berhasil diverifikasi"),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Outlets & items ----------

export function useOutlets() {
  return useQuery({
    queryKey: queryKeys.outlets,
    queryFn: outletApi.all,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOutletCoverage(lat: number, lng: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.outletCoverage(lat, lng),
    queryFn: () => outletApi.coverage(lat, lng),
    enabled,
    retry: false,
  });
}

export function useItems() {
  return useQuery({
    queryKey: queryKeys.items,
    queryFn: itemApi.all,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => itemApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.items }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      itemApi.update(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.items }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.items }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Addresses ----------

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: addressApi.all,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof addressApi.update>[1]) =>
      addressApi.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.setDefault(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Pickup request (customer) ----------

export function useCoverageCheck() {
  return useQuery({
    queryKey: queryKeys.coverageCheck,
    queryFn: pickupRequestApi.coverageCheck,
    retry: false,
  });
}

export function useCreatePickupRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pickupRequestApi.create,
    onSuccess: () => {
      toast.success("Permintaan penjemputan berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["pickup-requests"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useCancelPickupRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pickupRequestApi.cancel(id),
    onSuccess: () => {
      toast.success("Permintaan penjemputan dibatalkan");
      queryClient.invalidateQueries({ queryKey: ["pickup-requests"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function usePickupRequestStatus() {
  return useQuery({
    queryKey: queryKeys.pickupRequestStatus,
    queryFn: pickupRequestApi.status,
    retry: false,
  });
}

// ---------- Customer orders ----------

export function useCustomerActiveOrders() {
  return useQuery({
    queryKey: queryKeys.customerActiveOrders,
    queryFn: customerOrderApi.active,
    retry: false,
  });
}

export function useCustomerCompletedOrders() {
  return useQuery({
    queryKey: queryKeys.customerCompletedOrders,
    queryFn: customerOrderApi.complete,
    retry: false,
  });
}

export function useUploadPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, urlProof }: { orderId: string; urlProof: string }) =>
      customerOrderApi.uploadPaymentProof(orderId, urlProof),
    onSuccess: () => {
      toast.success("Bukti pembayaran berhasil diunggah");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => customerOrderApi.cancelPayment(orderId),
    onSuccess: () => {
      toast.success("Pembayaran dibatalkan");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function usePaymentGateway(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["orders", orderId, "payment-gateway"],
    queryFn: () => customerOrderApi.paymentGateway(orderId),
    enabled,
    retry: false,
  });
}

export function useSetPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, paymentMethod }: { orderId: string; paymentMethod: "manual" | "payment_gateway" }) =>
      customerOrderApi.setPaymentMethod(orderId, paymentMethod),
    onSuccess: () => {
      toast.success("Metode pembayaran dipilih");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useMarkDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => customerOrderApi.markDone(orderId),
    onSuccess: () => {
      toast.success("Pesanan selesai");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: { complaintMessage: string; complaintImage: string } }) =>
      customerOrderApi.complaint(orderId, body),
    onSuccess: () => {
      toast.success("Keluhan berhasil dikirim");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Driver ----------

export function usePickupAvailable() {
  return useQuery({
    queryKey: queryKeys.pickupAvailable,
    queryFn: pickupOrderApi.available,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function usePickupActive() {
  return useQuery({
    queryKey: queryKeys.pickupActive,
    queryFn: pickupOrderApi.active,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function usePickupCompleted() {
  return useQuery({
    queryKey: queryKeys.pickupCompleted,
    queryFn: pickupOrderApi.completed,
    retry: false,
  });
}

export function useAcceptPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pickupOrderApi.accept(id),
    onSuccess: () => {
      toast.success("Pesanan penjemputan diterima");
      queryClient.invalidateQueries({ queryKey: ["pickup"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function usePickupNextStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pickupOrderApi.next(id),
    onSuccess: () => {
      toast.success("Status pekerjaan diperbarui");
      queryClient.invalidateQueries({ queryKey: ["pickup"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useDeliveryAvailable() {
  return useQuery({
    queryKey: queryKeys.deliveryAvailable,
    queryFn: deliveryOrderApi.available,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useDeliveryActive() {
  return useQuery({
    queryKey: queryKeys.deliveryActive,
    queryFn: deliveryOrderApi.active,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useDeliveryCompleted() {
  return useQuery({
    queryKey: queryKeys.deliveryCompleted,
    queryFn: deliveryOrderApi.completed,
    retry: false,
  });
}

export function useAcceptDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => deliveryOrderApi.accept(deliveryId),
    onSuccess: () => {
      toast.success("Pesanan pengiriman diterima");
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useDeliveryNextStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => deliveryOrderApi.next(deliveryId),
    onSuccess: () => {
      toast.success("Status pekerjaan diperbarui");
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Worker ----------

export function useWorkerAvailable() {
  return useQuery({
    queryKey: queryKeys.workerAvailable,
    queryFn: workerStationApi.available,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useWorkerActive() {
  return useQuery({
    queryKey: queryKeys.workerActive,
    queryFn: workerStationApi.active,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useWorkerCompleted() {
  return useQuery({
    queryKey: queryKeys.workerCompleted,
    queryFn: workerStationApi.completedJobs,
    retry: false,
  });
}

export function useAcceptWorkerJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => workerStationApi.accept(orderId),
    onSuccess: () => {
      toast.success("Pekerjaan diterima");
      queryClient.invalidateQueries({ queryKey: ["worker"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useReinputItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items }: { orderId: string; items: { itemId: string; itemQuantity: number }[] }) =>
      workerStationApi.reinput(orderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useWorkerMarkDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => workerStationApi.complete(orderId),
    onSuccess: () => {
      toast.success("Pekerjaan selesai");
      queryClient.invalidateQueries({ queryKey: ["worker"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useWorkerItemSearch(keyword: string) {
  const debounced = useDebounce(keyword.trim(), 350);
  return useQuery({
    queryKey: [...queryKeys.itemSearch, debounced] as const,
    queryFn: () => itemApi.searchAuthenticated(debounced),
    enabled: debounced.length > 0,
    retry: false,
  });
}

// ---------- Admin: orders ----------

export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.adminOrders,
    queryFn: adminOrderApi.list,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useUpdateOrderItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: { totalWeights: number; items: { id?: string; name?: string; quantity: number }[] } }) =>
      adminOrderApi.updateItem(orderId, body),
    onSuccess: () => {
      toast.success("Item pesanan diperbarui");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useAdminPaymentProofs() {
  return useQuery({
    queryKey: queryKeys.adminPaymentProofs,
    queryFn: adminOrderApi.paymentProofs,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function usePaymentProofAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approved" | "rejected" }) =>
      adminOrderApi.paymentProofAction(id, action),
    onSuccess: () => {
      toast.success("Bukti pembayaran diperbarui");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useAdminComplaints() {
  return useQuery({
    queryKey: queryKeys.adminComplaints,
    queryFn: adminOrderApi.complaints,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useComplaintAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, status, adminResponse }: { complaintId: string; status: "resolved" | "rejected"; adminResponse: string }) =>
      adminOrderApi.complaintAction(complaintId, status, adminResponse),
    onSuccess: () => {
      toast.success("Keluhan diperbarui");
      queryClient.invalidateQueries({ queryKey: ["admin", "complaints"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Admin: walk-in ----------

export function useSearchWalkIn(keyword: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminWalkIn(keyword),
    queryFn: () => adminWalkInApi.search(keyword),
    enabled: enabled && keyword.trim().length > 0,
    retry: false,
  });
}

export function useCreateWalkIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminWalkInApi.create,
    onSuccess: () => {
      toast.success("Pelanggan walk-in dibuat");
      queryClient.invalidateQueries({ queryKey: ["admin", "walk-in"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useUpdateWalkIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; phone?: string } }) =>
      adminWalkInApi.update(id, body),
    onSuccess: () => {
      toast.success("Pelanggan walk-in diperbarui");
      queryClient.invalidateQueries({ queryKey: ["admin", "walk-in"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useDeleteWalkIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminWalkInApi.remove(id),
    onSuccess: () => {
      toast.success("Pelanggan walk-in dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin", "walk-in"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useCreateWalkInOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof adminWalkInApi.createOrder>[1] }) =>
      adminWalkInApi.createOrder(id, body),
    onSuccess: () => {
      toast.success("Pesanan walk-in dibuat");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Admin: mismatch ----------

export function useMismatchList(station?: "washing" | "ironing" | "packing") {
  return useQuery({
    queryKey: queryKeys.mismatchList(station),
    queryFn: () => adminMismatchApi.list(station),
    retry: false,
  });
}

export function useMismatchDetail(orderId: string, station: "washing" | "ironing" | "packing") {
  return useQuery({
    queryKey: queryKeys.mismatchDetail(orderId, station),
    queryFn: () => adminMismatchApi.detail(orderId, station),
    retry: false,
  });
}

export function useManageMismatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, stationName, body }: { orderId: string; stationName: "washing" | "ironing" | "packing"; body: { finalQuantities: { itemId: string; latestQuantity: number }[]; itemDecisions: { itemId: string; status: "approved" | "rejected"; adminNote?: string }[] } }) =>
      adminMismatchApi.manage(orderId, stationName, body),
    onSuccess: () => {
      toast.success("Mismatch berhasil dikelola");
      queryClient.invalidateQueries({ queryKey: ["admin", "mismatch"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Admin: schedule ----------

export function useScheduleSummary() {
  return useQuery({
    queryKey: queryKeys.scheduleSummary,
    queryFn: workerShiftApi.summary,
    retry: false,
  });
}

export function useSchedule(filters: { role?: "driver" | "worker"; station?: "washing" | "ironing" | "packing"; name?: "asc" | "desc" } = {}) {
  const key = [filters.role ?? "all", filters.station ?? "all", filters.name ?? "all"].join(":");
  return useQuery({
    queryKey: queryKeys.schedule(key),
    queryFn: () => workerShiftApi.schedule(filters),
    retry: false,
  });
}

export function useUnassignedWorkers(keyword: string, role: "driver" | "worker" | "") {
  return useQuery({
    queryKey: queryKeys.unassignedWorkers(keyword, role),
    queryFn: () =>
      workerShiftApi.unassigned({
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
        ...(role ? { role } : {}),
      }),
    retry: false,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workerId, schedules }: { workerId: string; schedules: { day: string; start: string; end: string }[] }) =>
      workerShiftApi.create(workerId, schedules as { day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; start: string; end: string }[]),
    onSuccess: () => {
      toast.success("Jadwal shift tersimpan");
      queryClient.invalidateQueries({ queryKey: ["admin", "schedule"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Admin: users ----------

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: adminUserApi.all,
    retry: false,
  });
}

export function useRegisterInternalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminUserApi.register,
    onSuccess: () => {
      toast.success("Akun staf berhasil dibuat, email verifikasi terkirim");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "super_admin" | "outlet_admin" | "driver" | "customer" | "worker" }) =>
      adminUserApi.changeRole(userId, role),
    onSuccess: () => {
      toast.success("Peran pengguna diubah");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminUserApi.remove(userId),
    onSuccess: () => {
      toast.success("Pengguna dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Admin: outlets (super admin) ----------

export function useCreateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminOutletApi.create,
    onSuccess: () => {
      toast.success("Outlet berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof adminOutletApi.update>[1]) =>
      adminOutletApi.update(id, body),
    onSuccess: () => {
      toast.success("Outlet berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

export function useDeleteOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminOutletApi.remove(id),
    onSuccess: () => {
      toast.success("Outlet dihapus");
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
    onError: (error) => toast.error(normalizeError(error).message),
  });
}

// ---------- Cloudinary ----------

export function useCloudinarySignature(folder: "avatars" | "payment-proofs" | "complaints", params?: string) {
  return useQuery({
    queryKey: ["signature", folder, params ?? ""],
    queryFn: () => cloudinaryApi.signature(folder, params),
    staleTime: 10 * 60 * 1000,
  });
}
