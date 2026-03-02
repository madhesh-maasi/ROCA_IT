import * as React from "react";
import { Dialog, DialogProps } from "primereact/dialog";
import { ActionButton } from "../ActionButton";
import styles from "./Popup.module.scss";

export interface IPopupProps extends Omit<
  DialogProps,
  "visible" | "onHide" | "header"
> {
  /** Controls popup visibility. */
  visible: boolean;
  /** Called when the dialog requests to be closed (X button, mask click, Escape key). */
  onHide: () => void;
  /** Title text or React node shown in the dialog header. */
  header?: React.ReactNode;
  /** Content to render inside the dialog body. */
  children?: React.ReactNode;
  /** Custom footer content. Overrides the default Close button. */
  footer?: React.ReactNode;
  /** Dialog width (CSS value, e.g. '600px' or '50vw'). Defaults to '500px'. */
  width?: string;
  /** Label for the default footer close button. Defaults to 'Close'. */
  closeLabel?: string;
  /** Primary action label (shown only when onConfirm is provided). */
  confirmLabel?: string;
  /** Primary action handler. When provided, a Confirm button is shown in the footer. */
  onConfirm?: () => void;
}

/**
 * A reusable modal dialog built on PrimeReact Dialog.
 *
 * @example
 * <Popup
 *   visible={showDialog}
 *   onHide={() => setShowDialog(false)}
 *   header="Confirm Submission"
 *   confirmLabel="Submit"
 *   onConfirm={handleSubmit}
 * >
 *   <p>Are you sure you want to submit the form?</p>
 * </Popup>
 */
const Popup: React.FC<IPopupProps> = ({
  visible,
  onHide,
  header,
  children,
  footer,
  width = "500px",
  closeLabel = "Close",
  confirmLabel = "Confirm",
  onConfirm,
  ...rest
}) => {
  const defaultFooter = (
    <div className={styles.footerActions}>
      <ActionButton
        variant="cancel"
        label={closeLabel}
        onClick={onHide}
        className="p-button-outlined p-button-secondary"
      />
      {onConfirm && (
        <ActionButton
          variant="approve"
          label={confirmLabel}
          onClick={onConfirm}
          className="p-button-primary"
        />
      )}
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      footer={footer ?? defaultFooter}
      style={{ width }}
      className={styles.popup}
      maskClassName={styles.popupMask}
      modal
      draggable={false}
      resizable={false}
      showCloseIcon={false}
      {...rest}
    >
      <div className={styles.popupBody}>{children}</div>
    </Dialog>
  );
};

export { Popup };
export default Popup;
