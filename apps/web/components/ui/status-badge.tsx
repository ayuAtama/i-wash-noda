interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "primary" | "default";
  }
> = {
  // Order statuses
  arrived_at_outlet: { label: "Arrived", variant: "primary" },
  washing_in_progress: { label: "Washing", variant: "primary" },
  washing_completed: { label: "Washed", variant: "success" },
  ironing_in_progress: { label: "Ironing", variant: "warning" },
  ironing_completed: { label: "Ironed", variant: "success" },
  packing_in_progress: { label: "Packing", variant: "warning" },
  packed: { label: "Packed", variant: "success" },
  ready_for_pickup: { label: "Ready", variant: "success" },
  out_for_delivery: { label: "Out for Delivery", variant: "primary" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  pending: { label: "Pending", variant: "warning" },
  // Payment statuses
  pending_payment: { label: "Pending Payment", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  payment_rejected: { label: "Payment Rejected", variant: "danger" },
  confirmed: { label: "Confirmed", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  // Generic
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  accepted: { label: "Accepted", variant: "primary" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, " "),
    variant: "default" as const,
  };

  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-primary-100 text-primary-700",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  };

  const dotColors = {
    default: "bg-gray-500",
    primary: "bg-primary-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${variants[config.variant]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColors[config.variant]}`}
      />
      {config.label}
    </span>
  );
}
