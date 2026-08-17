import type { ApiEnvelope } from "./client";

export const ROLES = [
  "super_admin",
  "outlet_admin",
  "worker",
  "driver",
  "customer",
] as const;
export type Role = (typeof ROLES)[number];

export const WORKER_STATIONS = ["washing", "ironing", "packing"] as const;
export type WorkerStation = (typeof WORKER_STATIONS)[number];

export type StationName = WorkerStation;

export const ORDER_STATUSES = [
  "waiting_for_driver_pickup",
  "out_for_pickup",
  "in_transit_to_outlet",
  "arrived_at_outlet",
  "washing_in_progress",
  "ironing_in_progress",
  "packing_in_progress",
  "waiting_for_payment",
  "waiting_for_driver_deliver",
  "out_for_delivery",
  "delivered",
  "complaint_received",
  "cancelled",
  "finished",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DRIVER_JOB_STATUSES = ["in_transit", "on_delivery", "done"] as const;
export type DriverJobStatus = (typeof DRIVER_JOB_STATUSES)[number];

export const WORKER_SHIFT_DAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WorkerShiftDay = (typeof WORKER_SHIFT_DAYS)[number];

export const ORDER_SOURCES = ["customer_app", "walk_in"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const MISMATCH_STATUSES = ["pending", "approved", "rejected"] as const;
export type MismatchStatus = (typeof MISMATCH_STATUSES)[number];

export const PAYMENT_PROOF_STATUSES = ["pending", "approved", "rejected"] as const;
export type PaymentProofStatus = (typeof PAYMENT_PROOF_STATUSES)[number];

export const COMPLAINT_STATUSES = ["pending", "resolved", "rejected"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const PAYMENT_METHODS = ["manual", "payment_gateway"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CLOUDINARY_FOLDERS = [
  "avatars",
  "payment-proofs",
  "complaints",
] as const;
export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[number];

// ---------- Auth / user ----------

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  worker_station?: WorkerStation | null;
  outlet_id?: string | null;
  image?: string | null;
  emailVerified: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  name: string | null;
  email: string;
  role: Role;
  worker_station: WorkerStation | null;
}

export interface MeUser {
  name: string | null;
  email: string;
  "pending email": string | null;
  "email verified": boolean;
  role: Role;
  image: string | null;
  "created at": string;
  "updated at": string;
}

export interface MeResponse {
  message: string;
  success: boolean;
  data: MeUser;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface VerifyResponse {
  success: boolean;
  message: string;
}

export interface ResendResponse {
  success: boolean;
  status: "unverified" | "verified" | "verified and completed registration";
}

export interface CompleteRegisterResponse {
  success: boolean;
  message: string;
}

export interface ResetRequestResponse {
  success: boolean;
  message: string;
}

export interface ResetConfirmResponse {
  success: boolean;
  message: string;
}

export interface ChangeEmailRequestResponse {
  success: boolean;
  message: string;
}

export interface ChangeEmailConfirmResponse {
  name: string | null;
  email: string;
  "pending email": string | null;
  "email verified": boolean;
  role: Role;
  image: string | null;
  "created at": string;
  "updated at": string;
}

export type SetupStatusResponse = ApiEnvelope<{ setupRequired: boolean }>;

export interface SetupSuperAdminResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

// ---------- Outlet ----------

export interface Outlet {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  max_distance_km: number;
  price_per_km: number;
  price_per_kg: number;
  is_deleted?: boolean;
}

export interface Item {
  id: string;
  name: string;
}

export type OutletCoverageResponse = ApiEnvelope<
  Array<Outlet & { distance_km?: number }>
>;

// ---------- Address ----------

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  address: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
}

// ---------- Pickup request (customer) ----------

export type CoverageCheckResponse = ApiEnvelope<{
  nearestOutlet: Outlet | null;
  address: Address | null;
}>;

export type CreatePickupRequestResponse = ApiEnvelope<unknown>;

// ---------- Order (customer-facing) ----------

export interface CustomerOrder {
  id: string;
  status: OrderStatus;
  paid: boolean;
  pickup_fee: number;
  delivery_fee: number;
  total_kilo: number;
  laundry_price: number;
  total_amount: number;
  updated_at: string;
  created_at: string;
  confirmed_at?: string | null;
}

export type CustomerActiveOrdersResponse = ApiEnvelope<CustomerOrder[]>;

export type CustomerCompletedOrdersResponse = ApiEnvelope<CustomerOrder[]>;

export type PaymentGatewayResponse = ApiEnvelope<{
  token: string;
  redirect_url?: string;
}>;

export type MarkDoneResponse = ApiEnvelope<{
  id: string;
  outlet: string;
  total_amount: number;
  confirmed_at: string;
}>;

// ---------- Driver: pickup ----------

export interface PickupRequestJob {
  id: string;
  order_id: string;
  customer_name: string;
  customer_address: string;
  customer_coordinates: string;
  gmap_link: string;
  created_at: string;
}

export type AcceptPickupResponse = ApiEnvelope<{
  id: string;
  customer: { name: string | null } | null;
  outlet: { name: string } | null;
  pickupAddress: { address: string | null } | null;
  pickupDriver: { name: string | null } | null;
  accepted: string;
}>;

export interface ActivePickupJob {
  id: string;
  status: DriverJobStatus;
  updated_at: string;
  customer: { name: string | null } | null;
  outlet: { name: string } | null;
  pickupAddress: {
    address: string | null;
    lat: string;
    lng: string;
  } | null;
}

export interface CompletedPickupJob {
  id: string;
  status: "done";
  order_id: string;
  customer_name: string | null;
  pickup_address: string | null;
  pickup_coordinates: string;
  created_at: string;
  updated_at: string;
}

// ---------- Driver: delivery ----------

export interface DeliveryRequestJob {
  id: string;
  order_id: string;
  customer_name: string;
  customer_address: string;
  customer_coordinates: string;
  gmap_link: string;
  created_at: string;
}

export type AcceptDeliveryResponse = ApiEnvelope<{
  id: string;
  driverName: string | null;
  outletName: string;
  customerName: string | null;
  deliveryAddress: string | null;
  deliveryCoordinates: string;
  accepted: string;
}>;

export interface ActiveDeliveryJob {
  id: string;
  status: DriverJobStatus;
  updated_at: string;
  customer: string | null;
  outlet: string;
  deliveryAddress: string | null;
  deliveryCoordinates: string;
}

export interface CompletedDeliveryJob {
  id: string;
  status: "done";
  order_id: string;
  customer_name: string | null;
  delivery_address: string | null;
  delivery_coordinates: string;
  created_at: string;
  updated_at: string;
}

// ---------- Worker ----------

export interface WorkerJob {
  id: string;
  status: OrderStatus;
  source: OrderSource;
  customer_name: string;
}

export interface WorkerCompleteJob {
  id: string;
  customerName: string;
  completedAt: string;
}

export interface ReInputItem {
  itemId: string;
  itemQuantity: number;
}

export interface ReInputMatchResult {
  itemId: string;
  quantity: number;
}

export interface ReInputResponse {
  success: boolean;
  message: string;
  data:
    | { match: ReInputMatchResult[] }
    | {
        match: ReInputMatchResult[];
        mismatch: ReInputMatchResult[];
        new: ReInputMatchResult[];
        lost: ReInputMatchResult[];
      };
}

export type WorkerMarkDoneResponse = ApiEnvelope<{
  id: string;
  status: OrderStatus;
  source: OrderSource;
  customer_name: string;
}>;

// ---------- Admin: orders ----------

export interface AdminOrderItem {
  id: string;
  customer_id: string | null;
  walkin_customer_id: string | null;
  customer_name: string | null;
  pickupAddress: { address: string | null } | null;
  pickupDriver: { name: string | null } | null;
  deliveryDriver: { name: string | null } | null;
  pickup_fee: number;
  delivery_fee: number;
  total_kilo: number;
  laundry_price: number;
  total_amount: number;
  paid: boolean;
  created_at: string;
}

export interface AdminOrderItemInput {
  id?: string;
  name?: string;
  quantity: number;
}

export interface PaymentProofEntry {
  id: string;
  orderId: string;
  customerName: string | null;
  customerImage: string | null;
  approved: PaymentProofStatus;
  isDeleted: boolean;
  imageProofUrl: string;
  totalAmount: number;
  updatedAt: string;
  createdAt: string;
}

export type PaymentProofListResponse = ApiEnvelope<PaymentProofEntry[]>;

export type PaymentProofActionResponse = ApiEnvelope<{
  order?: {
    id: string;
    status: OrderStatus;
    paid: boolean;
  };
  paymentProof?: { order_id: string; status: PaymentProofStatus };
  deliveryRequest?: { id: string };
}>;

export interface ComplaintEntry {
  id: string;
  orderId: string;
  customerName: string | null;
  message: string;
  imageUrl: string | null;
  status: ComplaintStatus;
  createdAt: string;
}

export type ComplaintListResponse = ApiEnvelope<ComplaintEntry[]>;

export type ComplaintActionResponse = ApiEnvelope<unknown>;

// ---------- Admin: walk-in customer ----------

export interface WalkInCustomer {
  id: string;
  name: string;
  phone: string;
  created_by: string;
  outlet_id: string;
  created_at: string;
}

// ---------- Admin: mismatch ----------

export interface MismatchListEntry {
  order_id: string;
  station: StationName;
  created_at: string;
}

export type MismatchListResponse = ApiEnvelope<MismatchListEntry[]>;

export interface MismatchDetailItem {
  itemId: string;
  itemName: string;
  quantityInput: number;
  adminNote: string | null;
  station: StationName;
}

export interface MismatchExpectedItem {
  itemId: string;
  expectedQuantity: number;
}

export type MismatchDetailResponse = ApiEnvelope<{
  mismatch: MismatchDetailItem[];
  expectedItems: MismatchExpectedItem[];
}>;

export interface MismatchDecision {
  itemId: string;
  status: "approved" | "rejected";
  adminNote?: string;
}

export interface MismatchFinalQuantity {
  itemId: string;
  latestQuantity: number;
}

export type ManageMismatchResponse = ApiEnvelope<unknown>;

// ---------- Admin: schedule ----------

export interface ScheduleSummary {
  totalWorker: number;
  totalDriver: number;
  totalOnDuty: number;
  today: WorkerShiftDay;
}

export interface UnScheduledWorker {
  id: string;
  name: string | null;
  role: Role;
  worker_station: WorkerStation | null;
}

export interface ScheduleShift {
  id: string;
  worker_id: string;
  day_of_week: WorkerShiftDay;
  start_time: string;
  end_time: string;
  station: StationName | null;
  name: string;
}

export interface ScheduleItemInput {
  day: WorkerShiftDay;
  start: string;
  end: string;
}

// ---------- Admin: users ----------

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  worker_station: WorkerStation | null;
  outlet_id: string | null;
  image: string | null;
  emailVerified?: boolean;
}

// ---------- Cloudinary ----------

export interface CloudinarySignature {
  success: boolean;
  message: string;
  data: {
    public_id: string;
    timestamp: number;
    signature: string;
    folder: string;
    overwrite: boolean;
    allowed_formats: string[];
    cloudName: string;
    apiKey: string;
  };
}
