import * as React from "react";
import styles from "./StatusBadge.module.scss";

// All known statuses — extend as needed
export type StatusVariant =
  | "submitted"
  | "approved"
  | "rework"
  | "cancelled"
  | "pending"
  | "draft"
  | "completed"
  | "not_submitted"
  | "released";

const STATUS_CONFIG: Record<
  StatusVariant,
  { label: string; icon: string; colorClass: string }
> = {
  submitted: {
    label: "Submitted",
    icon: "pi pi-book",
    colorClass: styles.submitted,
  },
  approved: {
    label: "Approved",
    icon: "pi pi-check-circle",
    colorClass: styles.approved,
  },
  rework: { label: "Rework", icon: "pi pi-undo", colorClass: styles.rework },
  cancelled: {
    label: "Cancelled",
    icon: "pi pi-times",
    colorClass: styles.cancelled,
  },
  pending: {
    label: "Pending",
    icon: "pi pi-clock",
    colorClass: styles.pending,
  },
  draft: { label: "Draft", icon: "pi pi-file", colorClass: styles.draft },
  completed: {
    label: "Completed",
    icon: "pi pi-verified",
    colorClass: styles.completed,
  },
  released: {
    label: "Released",
    icon: "pi pi-check-circle",
    colorClass: styles.released,
  },
  not_submitted: {
    label: "Not Submitted",
    icon: "pi pi-times-circle",
    colorClass: styles.notSubmitted,
  },
};

export interface IStatusBadgeProps {
  /** The status to display. */
  status: StatusVariant;
  /** Override the display label (optional). */
  label?: string;
  /** Additional class for the outer span. */
  className?: string;
}

/**
 * A pill-shaped status badge with a coloured icon + label.
 *
 * @example
 * <StatusBadge status="submitted" />
 * <StatusBadge status="rework" label="Needs Rework" />
 */
const StatusBadge: React.FC<IStatusBadgeProps> = ({
  status,
  label,
  className,
}) => {
  const config =
    STATUS_CONFIG[status.toLowerCase() as StatusVariant] ||
    STATUS_CONFIG["draft"];
  const displayLabel = label ?? config.label;

  return (
    <span
      className={`${styles.badge} ${config.colorClass} ${className || ""}`}
      title={displayLabel}
    >
      <i className={`${config.icon} ${styles.badgeIcon}`} />
      <span className={styles.badgeLabel}>{displayLabel}</span>
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;
