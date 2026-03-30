/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable /* eslint-disable @typescript-eslint/no-require-imports */
import * as React from "react";
import { Dialog } from "primereact/dialog";
import { ActionButton } from "../ActionButton";
import styles from "./StatusPopup.module.scss";

// Import assets
const ApprovedImg = require("../../common/Asset/Images/Approved.png");
const ReworkImg = require("../../common/Asset/Images/Rework.png");
const DownloadImg = require("../../common/Asset/Images/Download.png");

export type StatusPopupType =
  | "approve"
  | "success"
  | "rework"
  | "download"
  | "extend";

export interface IStatusPopupProps {
  /** Controls popup visibility. */
  visible: boolean;
  /** Called when the dialog requests to be closed. */
  onHide: () => void;
  /** Action type to display. */
  type: StatusPopupType;
  /** Primary action handler (for confirmation types). */
  onConfirm?: () => void;
  /** Custom description text. */
  description?: string;
}

const StatusPopup: React.FC<IStatusPopupProps> = ({
  visible,
  onHide,
  type,
  onConfirm,
  description,
}) => {
  const getConfig = () => {
    switch (type) {
      case "approve":
        return {
          image: ApprovedImg,
          header: "Approve",
          confirmLabel: "Yes, Approve",
          cancelLabel: "No",
          showFooter: true,
          defaultDescription:
            "Are you sure you want to Approve this IT Declaration ?",
          isSuccess: false,
        };
      case "rework":
        return {
          image: ReworkImg,
          header: "Rework",
          confirmLabel: "Yes",
          cancelLabel: "No",
          showFooter: true,
          defaultDescription:
            "Are you sure you want to send this IT Declaration for Rework ?",
          isSuccess: false,
        };
      case "download":
        return {
          image: DownloadImg,
          header: "",
          confirmLabel: "",
          cancelLabel: "",
          showFooter: false,
          defaultDescription: "Downloaded successfully",
          isSuccess: true,
        };
      case "extend":
        return {
          image: ApprovedImg,
          header: "",
          confirmLabel: "",
          cancelLabel: "",
          showFooter: false,
          defaultDescription: "Extend successfully",
          isSuccess: true,
        };
      case "success":
      default:
        return {
          image: ApprovedImg,
          header: "",
          confirmLabel: "",
          cancelLabel: "",
          showFooter: false,
          defaultDescription: "Submitted successfully",
          isSuccess: true,
        };
    }
  };

  const config = getConfig();
  const displayDescription = description || config.defaultDescription;

  const footer = (
    <div className={styles.footerActions}>
      {!config.isSuccess && (
        <ActionButton
          variant="cancel"
          label={config.cancelLabel}
          onClick={onHide}
          className={styles.cancelBtn}
        />
      )}
      {config.isSuccess ? (
        <ActionButton
          variant="approve"
          label={config.cancelLabel}
          onClick={onHide}
          className={styles.okBtn}
        />
      ) : (
        <ActionButton
          variant="approve"
          label={config.confirmLabel}
          onClick={() => {
            if (onConfirm) onConfirm();
          }}
          className={styles.confirmBtn}
        />
      )}
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={config.header}
      footer={config.showFooter ? footer : null}
      className={styles.statusPopup}
      maskClassName={styles.popupMask}
      modal
      draggable={false}
      resizable={false}
      showCloseIcon={false}
    >
      <div className={styles.content}>
        <div className={styles.imageWrapper}>
          <img src={config.image} alt={type} className={styles.image} />
        </div>
        <p
          className={`${styles.description} ${config.isSuccess ? styles.successText : ""}`}
        >
          {displayDescription}
        </p>
      </div>
    </Dialog>
  );
};

export { StatusPopup };
export default StatusPopup;
