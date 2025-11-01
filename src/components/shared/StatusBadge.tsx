import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  // Booking statuses
  PENDING_PAYMENT: {
    label: "Pending Payment",
    variant: "secondary" as const,
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    variant: "default" as const,
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    icon: XCircle,
  },
  COMPLETED: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle,
  },

  // Match statuses
  OPEN: {
    label: "Open",
    variant: "secondary" as const,
    icon: Clock,
  },
  PENDING_OPPONENT: {
    label: "Waiting for Opponent",
    variant: "secondary" as const,
    icon: Clock,
  },

  // Payment statuses
  PENDING: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    variant: "secondary" as const,
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    variant: "default" as const,
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
  },
  REFUNDED: {
    label: "Refunded",
    variant: "outline" as const,
    icon: AlertCircle,
  },

  // Generic
  ACTIVE: {
    label: "Active",
    variant: "default" as const,
    icon: CheckCircle,
  },
  INACTIVE: {
    label: "Inactive",
    variant: "secondary" as const,
    icon: XCircle,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  const { label, variant, icon: Icon } = config;

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}