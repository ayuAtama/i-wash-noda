export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
  phone?: string;
  outlet_id?: number;
  worker_station?: WorkerStation;
  created_at: string;
}

export type Role =
  | "customer"
  | "outlet_admin"
  | "worker"
  | "driver"
  | "super_admin";

export type WorkerStation = "washing" | "ironing" | "packing";

export type OrderStatus =
  | "arrived_at_outlet"
  | "washing_in_progress"
  | "washing_completed"
  | "ironing_in_progress"
  | "ironing_completed"
  | "packing_in_progress"
  | "packed"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type MismatchStatus = "pending" | "approved" | "rejected";

export type OrderSource = "online" | "walk_in";

export interface Outlet {
  id: number;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  coverage_radius_km: number;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category: string;
  image?: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  outlet_id: number;
  user_id?: string;
  walk_in_customer_id?: string;
  status: OrderStatus;
  source: OrderSource;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: User;
  walk_in_customer?: WalkInCustomer;
  outlet?: Outlet;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity_initial: number;
  quantity_final?: number;
  price: number;
  subtotal: number;
  item?: Item;
}

export interface WalkInCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  outlet_id: number;
  created_at: string;
}

export interface PickupRequest {
  id: string;
  user_id: string;
  outlet_id: number;
  status: "pending" | "accepted" | "picked_up" | "cancelled";
  pickup_date?: string;
  pickup_time_slot?: string;
  notes?: string;
  address_id?: string;
  created_at: string;
  outlet?: Outlet;
  address?: Address;
}

export interface DeliveryRequest {
  id: string;
  order_id: string;
  driver_id?: string;
  status: "pending" | "accepted" | "completed";
  delivery_address?: string;
  notes?: string;
  created_at: string;
  order?: Order;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  image_url: string;
  status: "pending" | "confirmed" | "rejected";
  notes?: string;
  created_at: string;
}

export interface WorkerShift {
  id: string;
  worker_id: string;
  outlet_id: number;
  date: string;
  shift_start: string;
  shift_end: string;
  station: WorkerStation;
}

export interface Mismatch {
  id: string;
  order_id: string;
  reported_by: string;
  station: WorkerStation;
  description: string;
  status: MismatchStatus;
  resolution_note?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
