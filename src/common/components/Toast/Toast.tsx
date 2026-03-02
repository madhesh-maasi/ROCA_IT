import * as React from "react";
import { Toast as PrimeToast, ToastMessage } from "primereact/toast";
import styles from "./Toast.module.scss";

export type ToastSeverity = "success" | "info" | "warn" | "error";

export interface IToastProps {
  /** Ref forwarded to the underlying PrimeReact Toast so callers can trigger `toast.current.show(...)`. */
  toastRef: React.RefObject<PrimeToast>;
  /** Where the toast appears on screen. Defaults to 'top-right'. */
  position?:
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center"
    | "center";
  /** Additional class for the outer wrapper. */
  className?: string;
}

/**
 * A reusable toast notification component built on PrimeReact Toast.
 * Use the forwarded ref to imperatively show messages anywhere in the app.
 *
 * @example
 * // 1. Create a ref in the parent component:
 * const toastRef = React.useRef<Toast>(null);
 *
 * // 2. Render <AppToast> once (ideally near the root of your webpart):
 * <AppToast toastRef={toastRef} position="top-right" />
 *
 * // 3. Trigger toasts imperatively:
 * toastRef.current?.show({ severity: 'success', summary: 'Saved', detail: 'Record updated.' });
 * toastRef.current?.show({ severity: 'error',   summary: 'Error',  detail: 'Something went wrong.' });
 *
 * // Helper: use the exported showToast utility for convenience:
 * showToast(toastRef, 'warn', 'Warning', 'Please check your input.');
 */
const AppToast: React.FC<IToastProps> = ({
  toastRef,
  position = "top-right",
  className,
}) => {
  return (
    <div className={`${styles.toastWrapper} ${className || ""}`}>
      <PrimeToast ref={toastRef} position={position} />
    </div>
  );
};

/**
 * Show a toast notification via the provided ref.
 *
 * @param ref        The ref created with `React.useRef<Toast>(null)` and passed to <AppToast>.
 * @param severity   'success' | 'info' | 'warn' | 'error'
 * @param summary    Bold title line.
 * @param detail     Secondary body text (optional).
 * @param life       Override auto-dismiss ms (optional).
 */
export const showToast = (
  ref: React.RefObject<PrimeToast>,
  severity: ToastSeverity,
  summary: string,
  detail?: string,
  life?: number,
): void => {
  const message: ToastMessage = { severity, summary, detail, life };
  ref.current?.show(message);
};

export { AppToast };
export default AppToast;
