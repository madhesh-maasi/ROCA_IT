import * as React from "react";
import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import {
  ActionButton,
  ActionVariant,
} from "../../../CommonInputComponents/ActionButton/ActionButton";
import styles from "./ActionPopup.module.scss";

export type PopupActionType =
  | "Approve"
  | "Rework"
  | "Cancel"
  | "Submitted"
  | "Delete"
  | "Updated"
  | "Added";

export interface IActionPopupProps {
  /** Controls visibility of the popup */
  visible: boolean;
  /** Callback to hide the popup */
  onHide: () => void;
  /** Callback when confirm button is clicked */
  onConfirm: () => void;
  /** The type of action to represent */
  actionType: PopupActionType;
  /** Optional override for title */
  title?: string;
  /** Optional override for message text */
  message?: string;
  /** Optional override for confirm button label */
  confirmLabel?: string;
  /** Optional override for cancel button label */
  cancelLabel?: string;
  /** Optional custom content to render inside the popup body */
  children?: React.ReactNode;
  /** Optionally hide the large centered icon */
  hideIcon?: boolean;
  /** Icon flag for the button element. */
  iconFlag?: boolean;
}

const ACTION_CONFIG: Record<
  PopupActionType,
  {
    icon: string;
    iconClass: string;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string | undefined;
    actionVariant: ActionVariant;
    cancelVariant?: ActionVariant;
  }
> = {
  Approve: {
    icon: "pi pi-check",
    iconClass: styles.approve,
    title: "Approve",
    message: "Are you sure you want to\nApprove this IT Declaration?",
    confirmLabel: "Yes",
    cancelLabel: "No",
    actionVariant: "approve",
    cancelVariant: "cancel",
  },
  Rework: {
    icon: "pi pi-refresh",
    iconClass: styles.rework,
    title: "Rework",
    message: "Are you sure you want to send\nthis IT Declaration for Rework?",
    confirmLabel: "Yes",
    cancelLabel: "Cancel",
    actionVariant: "rework",
    cancelVariant: "cancel",
  },
  Cancel: {
    icon: "pi pi-times",
    iconClass: styles.cancel,
    title: "Cancel",
    message: "Are you sure you want to Cancel\nthis IT Declaration?",
    confirmLabel: "Yes",
    cancelLabel: "No",
    actionVariant: "cancel",
    cancelVariant: "save", // Using "save" variant (grey) for neutral "No"
  },
  Submitted: {
    icon: "pi pi-check",
    iconClass: styles.submitted,
    title: "Submitted",
    message: "IT Declaration has been\nsubmitted successfully.",
    confirmLabel: "",
    cancelLabel: undefined,
    actionVariant: "continue",
  },
  Delete: {
    icon: "pi pi-trash",
    iconClass: styles.delete,
    title: "Delete",
    message: "Are you sure you want to\ndelete this Item?",
    confirmLabel: "Yes",
    cancelLabel: "No",
    actionVariant: "delete",
    cancelVariant: "cancel",
  },
  Updated: {
    icon: "pi pi-check",
    iconClass: styles.updated,
    title: "Updated",
    message: "The Item has been\nupdated successfully.",
    confirmLabel: "",
    cancelLabel: undefined,
    actionVariant: "continue",
  },
  Added: {
    icon: "pi pi-check",
    iconClass: styles.added,
    title: "Added",
    message: "The Item has been\nadded successfully.",
    confirmLabel: "",
    cancelLabel: undefined,
    actionVariant: "continue",
  },
};

const ActionPopup: React.FC<IActionPopupProps> = ({
  visible,
  onHide,
  onConfirm,
  actionType,
  title,
  message,
  confirmLabel,
  cancelLabel,
  children,
  hideIcon = false,
  iconFlag = true,
}) => {
  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG["Approve"];

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      showHeader={false}
      closable={false}
      modal
      className={styles.dialogRoot}
      style={{ width: "400px", border: "none" }}
      contentStyle={{ padding: 0, borderRadius: "16px", background: "none" }}
      maskStyle={{
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className={styles.popupContent}>
        <h3 className={styles.title}>{title || config.title}</h3>

        {!hideIcon && (
          <div className={styles.iconContainer}>
            <div className={classNames(styles.iconWrapper, config.iconClass)}>
              {actionType === "Delete" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              ) : (
                <i className={config.icon} />
              )}
            </div>
          </div>
        )}

        {!children && (
          <div className={styles.message}>{message || config.message}</div>
        )}

        {children && <div className={styles.customContent}>{children}</div>}

        {(cancelLabel !== undefined ||
          config.cancelLabel !== undefined ||
          confirmLabel ||
          config.confirmLabel) && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className={styles.buttonGroup}>
              {(cancelLabel !== undefined
                ? cancelLabel
                : config.cancelLabel) && (
                <ActionButton
                  variant={config.cancelVariant || "cancel"}
                  label={cancelLabel || config.cancelLabel || "Cancel"}
                  onClick={onHide as any}
                  className={styles.cancelBtn}
                  iconFlag={false}
                />
              )}

              {(confirmLabel || config.confirmLabel) && (
                <ActionButton
                  variant={"save"}
                  label={confirmLabel || config.confirmLabel}
                  onClick={onConfirm as any}
                  className={styles.confirmBtn}
                  autoFocus
                  iconFlag={false}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ActionPopup;
