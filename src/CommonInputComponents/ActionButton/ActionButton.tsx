import * as React from "react";
import { Button, ButtonProps } from "primereact/button";
import styles from "./ActionButton.module.scss";

export type ActionVariant =
  | "approve"
  | "rework"
  | "cancel"
  | "save"
  | "continue"
  | "delete"
  | "upload"
  | "download"
  | "export"
  | "import"
  | "add"
  | "tab"
  | "expand"
  | "collapse"
  | "newDeclaration"
  | "draft";

const VARIANT_CONFIG: Record<
  ActionVariant,
  {
    label: string;
    icon: string;
    severity: ButtonProps["severity"];
    outlined?: boolean;
  }
> = {
  approve: { label: "Approve", icon: "pi pi-check", severity: "success" },
  rework: { label: "Rework", icon: "pi pi-refresh", severity: "warning" },
  cancel: {
    label: "Cancel",
    icon: "pi pi-times",
    severity: "danger",
    outlined: true,
  },
  save: { label: "Save", icon: "", severity: "secondary" },
  continue: {
    label: "Continue",
    icon: "",
    severity: undefined,
  },
  delete: { label: "Delete", icon: "pi pi-trash", severity: "danger" },
  upload: { label: "Upload", icon: "pi pi-upload", severity: "secondary" },
  download: {
    label: "Download",
    icon: "pi pi-download",
    severity: "secondary",
  },
  export: { label: "Export", icon: "pi pi-file-export", severity: "secondary" },
  import: { label: "Import", icon: "pi pi-file-import", severity: "secondary" },
  add: { label: "Add", icon: "pi pi-plus", severity: undefined },
  tab: { label: "", icon: "", severity: "secondary", outlined: true },
  expand: {
    label: "",
    icon: "pi pi-chevron-right",
    severity: "secondary",
    outlined: true,
  },
  collapse: {
    label: "",
    icon: "pi pi-chevron-left",
    severity: "secondary",
    outlined: true,
  },
  newDeclaration: {
    label: "New IT Declaration",
    icon: "pi pi-plus",
    severity: undefined,
  },
  draft: {
    label: "Draft",
    icon: "",
    severity: undefined,
  },
};

export interface IActionButtonProps extends Omit<ButtonProps, "severity"> {
  /** The action this button represents. Controls icon, label, and colour. */
  variant: ActionVariant;
  /** Override the default label for this variant. */
  label?: string;
  /** Called when the button is clicked. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional class for the button element. */
  className?: string;
}

/**
 * A semantically-styled action button built on PrimeReact Button.
 * Each variant ships with a preset label, icon, and colour theme.
 *
 * @example
 * <ActionButton variant="approve"  onClick={handleApprove} />
 * <ActionButton variant="rework"   onClick={handleRework} />
 * <ActionButton variant="cancel"   onClick={handleCancel} />
 * <ActionButton variant="save"     onClick={handleSave} loading={isSaving} />
 * <ActionButton variant="continue" onClick={handleNext} label="Next Step" />
 */
const ActionButton: React.FC<IActionButtonProps> = ({
  variant,
  label,
  icon,
  onClick,
  className,
  disabled,
  ...rest
}) => {
  const config = VARIANT_CONFIG[variant];
  const resolvedIcon = icon ?? config.icon;
  const iconNode =
    typeof resolvedIcon === "string" && resolvedIcon ? (
      <i className={resolvedIcon} />
    ) : (
      resolvedIcon
    );

  const defaultLabel = label ?? config.label;

  return (
    <Button
      label={defaultLabel}
      icon={iconNode}
      iconPos="left"
      severity={config.severity}
      outlined={config.outlined}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.actionButton} ${styles[variant]} ${className || ""}`}
      tooltipOptions={{ position: "top" }}
      {...rest}
    />
  );
};

export { ActionButton };
export default ActionButton;
