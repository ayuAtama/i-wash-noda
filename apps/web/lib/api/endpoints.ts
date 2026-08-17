import { client, type ApiEnvelope } from "./client";
import type {
  AcceptDeliveryResponse,
  AcceptPickupResponse,
  ActiveDeliveryJob,
  ActivePickupJob,
  Address,
  AdminOrderItem,
  AdminOrderItemInput,
  AdminUser,
  ChangeEmailConfirmResponse,
  ChangeEmailRequestResponse,
  CloudinaryFolder,
  CloudinarySignature,
  CompletedDeliveryJob,
  CompletedPickupJob,
  ComplaintActionResponse,
  ComplaintListResponse,
  CompleteRegisterResponse,
  CoverageCheckResponse,
  CreatePickupRequestResponse,
  CustomerActiveOrdersResponse,
  CustomerCompletedOrdersResponse,
  DeliveryRequestJob,
  DriverJobStatus,
  Item,
  LoginResponse,
  ManageMismatchResponse,
  MarkDoneResponse,
  MeResponse,
  MismatchDecision,
  MismatchDetailResponse,
  MismatchFinalQuantity,
  MismatchListResponse,
  Outlet,
  OutletCoverageResponse,
  PaymentGatewayResponse,
  PaymentProofActionResponse,
  PaymentProofListResponse,
  PickupRequestJob,
  ReInputItem,
  ReInputResponse,
  RegisterResponse,
  ResendResponse,
  ResetConfirmResponse,
  ResetRequestResponse,
  ScheduleItemInput,
  ScheduleShift,
  ScheduleSummary,
  SetupStatusResponse,
  SetupSuperAdminResponse,
  UnScheduledWorker,
  WalkInCustomer,
  WorkerCompleteJob,
  WorkerJob,
  WorkerMarkDoneResponse,
} from "./types";

const unwrap = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  const res = await promise;
  return res.data;
};

// ---------- Setup ----------

export const setupApi = {
  status: () =>
    unwrap<SetupStatusResponse>(client.get<SetupStatusResponse>("/api/setup/")),
  createSuperAdmin: (body: { email: string; name: string; password: string }) =>
    unwrap<SetupSuperAdminResponse>(
      client.post<SetupSuperAdminResponse>("/api/setup/", body),
    ),
};

// ---------- Auth ----------

export const authApi = {
  login: (body: { email: string; password: string }) =>
    unwrap<LoginResponse>(client.post<LoginResponse>("/api/login", body)),
  logout: () =>
    unwrap<{ success: boolean; message?: string }>(
      client.get<{ success: boolean; message?: string }>("/api/logout"),
    ),
  refresh: () =>
    unwrap<{ success: boolean; message?: string; accessToken?: string }>(
      client.get<{ success: boolean; message?: string; accessToken?: string }>(
        "/api/refresh",
      ),
    ),
  register: (body: { email: string }) =>
    unwrap<RegisterResponse>(client.post<RegisterResponse>("/api/register", body)),
  verify: (body: { token?: string }, query: { token?: string } = {}) =>
    unwrap<{ success: boolean; message: string }>(
      client.post<{ success: boolean; message: string }>("/api/verify", body, {
        params: query,
      }),
    ),
  completeRegister: (body: {
    email: string;
    name: string;
    password: string;
    phone?: string;
    role?: string;
  }) =>
    unwrap<CompleteRegisterResponse>(
      client.post<CompleteRegisterResponse>("/api/complete-register", body),
    ),
  resendOtp: (body: { email: string }) =>
    unwrap<ResendResponse>(client.post<ResendResponse>("/api/resend-otp", body)),
  resetRequest: (body: { email: string }) =>
    unwrap<ResetRequestResponse>(
      client.post<ResetRequestResponse>("/api/reset-password-request", body),
    ),
  resetConfirm: (body: { email: string; password: string; token: string }) =>
    unwrap<ResetConfirmResponse>(
      client.post<ResetConfirmResponse>("/api/reset-password-confirm", body),
    ),
  me: () =>
    unwrap<MeResponse>(client.get<MeResponse>("/api/me")),
  updateMe: (body: { name?: string; password?: string }) =>
    unwrap<MeResponse["data"]>(client.put<MeResponse["data"]>("/api/me", body)),
  changeEmailRequest: (body: { email: string }) =>
    unwrap<ChangeEmailRequestResponse>(
      client.post<ChangeEmailRequestResponse>("/api/change-email-request", body),
    ),
  changeEmailConfirm: (body: { email: string; token: string }) =>
    unwrap<ChangeEmailConfirmResponse>(
      client.put<ChangeEmailConfirmResponse>("/api/change-email-confirm", body),
    ),
  telegramEmailRequest: (body: { userId: string; email: string }) =>
    unwrap<{ success: boolean; message: string }>(
      client.post<{ success: boolean; message: string }>(
        "/api/telegram-email/request",
        body,
      ),
    ),
  telegramEmailVerify: (body: { userId: string; email: string; otp: string }) =>
    unwrap<{ success: boolean; message: string; data: { id: string; name: string | null; email: string; image: string | null; role: string; emailVerified: boolean } | null }>(
      client.post<{ success: boolean; message: string; data: { id: string; name: string | null; email: string; image: string | null; role: string; emailVerified: boolean } | null }>(
        "/api/telegram-email/verify",
        body,
      ),
    ),
};

// ---------- Outlets & items ----------

export const outletApi = {
  coverage: (lat: number, lng: number) =>
    unwrap<OutletCoverageResponse>(
      client.get<OutletCoverageResponse>("/api/outlets/coverage", {
        params: { lat, lng },
      }),
    ),
  all: () =>
    unwrap<ApiEnvelope<Outlet[]>>(
      client.get<ApiEnvelope<Outlet[]>>("/api/outlets/"),
    ),
};

export const itemApi = {
  all: () =>
    unwrap<ApiEnvelope<Item[]>>(
      client.get<ApiEnvelope<Item[]>>("/api/admin/items/"),
    ),
  search: (name: string) =>
    unwrap<ApiEnvelope<Item[]>>(
      client.get<ApiEnvelope<Item[]>>("/api/admin/items/search", {
        params: { name },
      }),
    ),
  searchAuthenticated: (name: string) =>
    unwrap<ApiEnvelope<Item[]>>(
      client.get<ApiEnvelope<Item[]>>("/api/items/search", {
        params: { name },
      }),
    ),
  create: (name: string) =>
    unwrap<ApiEnvelope<Item>>(
      client.post<ApiEnvelope<Item>>("/api/admin/items/", { name }),
    ),
  update: (id: string, name: string) =>
    unwrap<ApiEnvelope<Item>>(
      client.put<ApiEnvelope<Item>>(`/api/admin/items/${id}`, { name }),
    ),
  remove: (id: string) =>
    unwrap<ApiEnvelope<Item>>(
      client.delete<ApiEnvelope<Item>>(`/api/admin/items/${id}`),
    ),
};

// ---------- Addresses ----------

export const addressApi = {
  all: async () => {
    const res = await client.get<{
      success: boolean;
      message: string;
      data: { totalAddresses: number; addresses: Address[] };
    }>("/api/addresses/");
    return res.data.data.addresses;
  },
  create: (body: {
    label: string;
    address: string;
    lat: number;
    lng: number;
    isDefault?: boolean;
  }) =>
    unwrap<ApiEnvelope<Address>>(
      client.post<ApiEnvelope<Address>>("/api/addresses/", body),
    ),
  update: (
    id: string,
    body: Partial<{
      label: string;
      address: string;
      lat: number;
      lng: number;
      isDefault: boolean;
    }>,
  ) =>
    unwrap<ApiEnvelope<Address>>(
      client.put<ApiEnvelope<Address>>(`/api/addresses/${id}`, body),
    ),
  remove: (id: string) =>
    unwrap<ApiEnvelope<Address>>(
      client.delete<ApiEnvelope<Address>>(`/api/addresses/${id}`),
    ),
  setDefault: (id: string) =>
    unwrap<ApiEnvelope<Address>>(
      client.put<ApiEnvelope<Address>>(`/api/addresses/${id}/set-default`),
    ),
};

// ---------- Pickup request (customer) ----------

export const pickupRequestApi = {
  coverageCheck: () =>
    unwrap<CoverageCheckResponse>(
      client.get<CoverageCheckResponse>("/api/pickup-requests/coverage-check"),
    ),
  create: (body: { addressId: string; outletId: string }) =>
    unwrap<CreatePickupRequestResponse>(
      client.post<CreatePickupRequestResponse>("/api/pickup-requests/", body),
    ),
  cancel: (id: string) =>
    unwrap<unknown>(client.delete<unknown>(`/api/pickup-requests/${id}`)),
  status: () =>
    unwrap<CustomerActiveOrdersResponse>(
      client.get<CustomerActiveOrdersResponse>("/api/pickup-requests/status"),
    ),
};

// ---------- Customer orders ----------

export const customerOrderApi = {
  active: () =>
    unwrap<CustomerActiveOrdersResponse>(
      client.get<CustomerActiveOrdersResponse>("/api/orders/active"),
    ),
  complete: () =>
    unwrap<CustomerCompletedOrdersResponse>(
      client.get<CustomerCompletedOrdersResponse>("/api/orders/complete"),
    ),
  uploadPaymentProof: (orderId: string, urlProof: string) =>
    unwrap<unknown>(
      client.post<unknown>(`/api/orders/${orderId}/payment`, { urlProof }),
    ),
  cancelPayment: (orderId: string) =>
    unwrap<unknown>(
      client.post<unknown>(`/api/orders/${orderId}/payment/cancel`),
    ),
  paymentGateway: (orderId: string) =>
    unwrap<PaymentGatewayResponse>(
      client.get<PaymentGatewayResponse>(`/api/orders/${orderId}/payment-gateway`),
    ),
  setPaymentMethod: (orderId: string, paymentMethod: "manual" | "payment_gateway") =>
    unwrap<unknown>(
      client.post<unknown>(`/api/orders/${orderId}/payment/${paymentMethod}`),
    ),
  markDone: (orderId: string) =>
    unwrap<MarkDoneResponse>(
      client.post<MarkDoneResponse>(`/api/orders/${orderId}/complete`),
    ),
  complaint: (orderId: string, body: { complaintMessage: string; complaintImage: string }) =>
    unwrap<unknown>(
      client.post<unknown>(`/api/orders/${orderId}/complaint`, body),
    ),
};

// ---------- Driver: pickup ----------

export const pickupOrderApi = {
  available: () =>
    unwrap<ApiEnvelope<PickupRequestJob[]>>(
      client.get<ApiEnvelope<PickupRequestJob[]>>("/api/pickup-requests/"),
    ),
  accept: (id: string) =>
    unwrap<AcceptPickupResponse>(
      client.post<AcceptPickupResponse>(`/api/pickup-requests/${id}/accept`),
    ),
  active: () =>
    unwrap<ApiEnvelope<ActivePickupJob[]>>(
      client.get<ApiEnvelope<ActivePickupJob[]>>("/api/pickup-requests/accepted"),
    ),
  next: (id: string) =>
    unwrap<ApiEnvelope<{ id: string; status: DriverJobStatus }>>(
      client.patch<ApiEnvelope<{ id: string; status: DriverJobStatus }>>(
        `/api/pickup-requests/${id}/next`,
      ),
    ),
  completed: () =>
    unwrap<ApiEnvelope<CompletedPickupJob[]>>(
      client.get<ApiEnvelope<CompletedPickupJob[]>>(
        "/api/pickup-requests/already-picked-up",
      ),
    ),
};

// ---------- Driver: delivery ----------

export const deliveryOrderApi = {
  available: () =>
    unwrap<DeliveryRequestJob[]>(
      client.get<DeliveryRequestJob[]>("/api/driver/delivery-requests/available"),
    ),
  accept: (deliveryId: string) =>
    unwrap<AcceptDeliveryResponse>(
      client.post<AcceptDeliveryResponse>(
        `/api/driver/delivery-requests/${deliveryId}/accept`,
      ),
    ),
  active: () =>
    unwrap<ApiEnvelope<ActiveDeliveryJob[]>>(
      client.get<ApiEnvelope<ActiveDeliveryJob[]>>(
        "/api/driver/delivery-requests/active",
      ),
    ),
  next: (deliveryId: string) =>
    unwrap<{ id: string; status: DriverJobStatus }>(
      client.patch<{ id: string; status: DriverJobStatus }>(
        `/api/driver/delivery-requests/${deliveryId}/next`,
      ),
    ),
  completed: () =>
    unwrap<ApiEnvelope<CompletedDeliveryJob[]>>(
      client.get<ApiEnvelope<CompletedDeliveryJob[]>>(
        "/api/driver/delivery-requests/complete",
      ),
    ),
};

// ---------- Worker ----------

export const workerStationApi = {
  available: () =>
    unwrap<ApiEnvelope<WorkerJob[]>>(
      client.get<ApiEnvelope<WorkerJob[]>>("/api/workers/available"),
    ),
  active: () =>
    unwrap<ApiEnvelope<WorkerJob[]>>(
      client.get<ApiEnvelope<WorkerJob[]>>("/api/workers/active"),
    ),
  accept: (orderId: string) =>
    unwrap<ApiEnvelope<unknown>>(
      client.post<ApiEnvelope<unknown>>(`/api/workers/${orderId}/accept`),
    ),
  reinput: (orderId: string, items: ReInputItem[]) =>
    unwrap<ReInputResponse>(
      client.post<ReInputResponse>(`/api/workers/reinput/${orderId}`, { items }),
    ),
  complete: (orderId: string) =>
    unwrap<WorkerMarkDoneResponse>(
      client.post<WorkerMarkDoneResponse>(`/api/workers/complete/${orderId}`),
    ),
  completedJobs: () =>
    unwrap<ApiEnvelope<WorkerCompleteJob[]>>(
      client.get<ApiEnvelope<WorkerCompleteJob[]>>("/api/workers/complete"),
    ),
};

// ---------- Admin: orders ----------

export const adminOrderApi = {
  list: () =>
    unwrap<ApiEnvelope<AdminOrderItem[]>>(
      client.get<ApiEnvelope<AdminOrderItem[]>>("/api/admin/orders/"),
    ),
  updateItem: (
    orderId: string,
    body: { totalWeights: number; items: AdminOrderItemInput[] },
  ) =>
    unwrap<unknown>(
      client.patch<unknown>(`/api/admin/orders/${orderId}`, body),
    ),
  paymentProofs: () =>
    unwrap<PaymentProofListResponse>(
      client.get<PaymentProofListResponse>("/api/admin/orders/payment-proof/"),
    ),
  paymentProofAction: (id: string, action: "approved" | "rejected") =>
    unwrap<PaymentProofActionResponse>(
      client.post<PaymentProofActionResponse>(
        `/api/admin/orders/payment-proof/${id}/${action}`,
      ),
    ),
  complaints: () =>
    unwrap<ComplaintListResponse>(
      client.get<ComplaintListResponse>("/api/admin/orders/complaints"),
    ),
  complaintAction: (
    complaintId: string,
    status: "resolved" | "rejected",
    adminResponse: string,
  ) =>
    unwrap<ComplaintActionResponse>(
      client.post<ComplaintActionResponse>(
        `/api/admin/orders/complaints/${complaintId}/${status}`,
        { adminResponse },
      ),
    ),
};

// ---------- Admin: walk-in customer ----------

export const adminWalkInApi = {
  search: (keyword: string) =>
    unwrap<ApiEnvelope<WalkInCustomer[]>>(
      client.get<ApiEnvelope<WalkInCustomer[]>>("/api/admin/walk-in-customer/", {
        params: { keyword },
      }),
    ),
  create: (body: { name: string; phone: string }) =>
    unwrap<ApiEnvelope<WalkInCustomer>>(
      client.post<ApiEnvelope<WalkInCustomer>>("/api/admin/walk-in-customer/", body),
    ),
  update: (id: string, body: { name?: string; phone?: string }) =>
    unwrap<ApiEnvelope<WalkInCustomer>>(
      client.patch<ApiEnvelope<WalkInCustomer>>(`/api/admin/walk-in-customer/${id}`, body),
    ),
  remove: (id: string) =>
    unwrap<ApiEnvelope<WalkInCustomer>>(
      client.delete<ApiEnvelope<WalkInCustomer>>(`/api/admin/walk-in-customer/${id}`),
    ),
  createOrder: (
    id: string,
    body: {
      total_kilo: number;
      paid: boolean;
      items: AdminOrderItemInput[];
      pickup_fee: 0;
      delivery_fee: 0;
      laundry_price: 0;
      total_amount: 0;
      status: "arrived_at_outlet";
      source: "walk_in";
    },
  ) =>
    unwrap<ApiEnvelope<unknown>>(
      client.post<ApiEnvelope<unknown>>(
        `/api/admin/walk-in-customer/orders/${id}`,
        body,
      ),
    ),
};

// ---------- Admin: mismatch ----------

export const adminMismatchApi = {
  list: (stationName?: "washing" | "ironing" | "packing") =>
    unwrap<MismatchListResponse>(
      client.get<MismatchListResponse>("/api/admin/mismatch/", {
        params: stationName ? { stationName } : undefined,
      }),
    ),
  detail: (orderId: string, stationName: "washing" | "ironing" | "packing") =>
    unwrap<MismatchDetailResponse>(
      client.get<MismatchDetailResponse>(
        `/api/admin/mismatch/${orderId}/${stationName}`,
      ),
    ),
  manage: (
    orderId: string,
    stationName: "washing" | "ironing" | "packing",
    body: {
      finalQuantities: MismatchFinalQuantity[];
      itemDecisions: MismatchDecision[];
    },
  ) =>
    unwrap<ManageMismatchResponse>(
      client.put<ManageMismatchResponse>(
        `/api/admin/mismatch/${orderId}/${stationName}`,
        body,
      ),
    ),
};

// ---------- Admin: schedule ----------

export const workerShiftApi = {
  summary: () =>
    unwrap<ApiEnvelope<ScheduleSummary>>(
      client.get<ApiEnvelope<ScheduleSummary>>("/api/admin/schedule/summary-dashboard"),
    ),
  unassigned: (params: { keyword?: string; role?: "driver" | "worker" } = {}) =>
    unwrap<ApiEnvelope<UnScheduledWorker[]>>(
      client.get<ApiEnvelope<UnScheduledWorker[]>>("/api/admin/schedule/no-shift-workers", {
        params,
      }),
    ),
  schedule: (params: {
    role?: "driver" | "worker";
    station?: "washing" | "ironing" | "packing";
    name?: "asc" | "desc";
  } = {}) =>
    unwrap<ApiEnvelope<ScheduleShift[]>>(
      client.get<ApiEnvelope<ScheduleShift[]>>("/api/admin/schedule/", { params }),
    ),
  create: (workerId: string, schedules: ScheduleItemInput[]) =>
    unwrap<unknown>(
      client.post<unknown>(`/api/admin/schedule/${workerId}`, { schedules }),
    ),
};

// ---------- Admin: users ----------

export const adminUserApi = {
  all: () =>
    unwrap<ApiEnvelope<AdminUser[]>>(
      client.get<ApiEnvelope<AdminUser[]>>("/api/admin/users"),
    ),
  register: (body: {
    email: string;
    role: "super_admin" | "outlet_admin" | "driver" | "customer" | "worker";
    outlet_id?: string;
  }) =>
    unwrap<ApiEnvelope<{ role: string; emailVerified: boolean }>>(
      client.post<ApiEnvelope<{ role: string; emailVerified: boolean }>>(
        "/api/admin/register",
        body,
      ),
    ),
  changeRole: (userId: string, role: "super_admin" | "outlet_admin" | "driver" | "customer" | "worker") =>
    unwrap<ApiEnvelope<{ id: string; name: string | null; email: string; role: string }>>(
      client.patch<ApiEnvelope<{ id: string; name: string | null; email: string; role: string }>>(
        "/api/admin/users",
        { userId, role },
      ),
    ),
  remove: (userId: string) =>
    unwrap<ApiEnvelope<{ id: string; name: string | null; email: string }>>(
      client.delete<ApiEnvelope<{ id: string; name: string | null; email: string }>>(
        `/api/admin/users/${userId}`,
      ),
    ),
};

// ---------- Admin: outlets (super admin) ----------

export const adminOutletApi = {
  create: (body: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    max_distance_km: number;
    price_per_km: number;
    price_per_kg: number;
  }) => unwrap<ApiEnvelope<Outlet>>(client.post<ApiEnvelope<Outlet>>("/api/admin/outlets/", body)),
  update: (
    id: string,
    body: Partial<{
      name: string;
      address: string;
      lat: number;
      lng: number;
      max_distance_km: number;
      price_per_km: number;
      price_per_kg: number;
    }>,
  ) => unwrap<ApiEnvelope<Outlet>>(client.put<ApiEnvelope<Outlet>>(`/api/admin/outlets/${id}`, body)),
  remove: (id: string) =>
    unwrap<ApiEnvelope<Outlet>>(client.delete<ApiEnvelope<Outlet>>(`/api/admin/outlets/${id}`)),
};

// ---------- Cloudinary ----------

export const cloudinaryApi = {
  signature: (folder: CloudinaryFolder, params?: string) =>
    unwrap<CloudinarySignature>(
      client.get<CloudinarySignature>(
        `/api/signature/${folder}${params ? `/${params}` : ""}`,
      ),
    ),
};
