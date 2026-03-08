import * as React from "react";
import {
  InputField,
  AppDropdown,
  AppCalendar,
} from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface IPreviousEmployerData {
  employerName: string;
  employerPan: string;
  employerAddress: string;
  employerTan: string;
  periodFrom: Date | null;
  periodTo: Date | null;
  salaryAfterExemption: string;
  pfContribution: string;
  vpfContribution: string;
  professionalTax: string;
  taxDeductedAtSource: string;
}

interface IPreviousEmployerStepProps {
  data: IPreviousEmployerData;
  onChange: (field: keyof IPreviousEmployerData, val: any) => void;
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  readOnly?: boolean;
  // ── Document upload ──────────────────────────────────────────────
  attachments?: Record<string, any[]>;
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (key: string, fileId: number) => Promise<void>;
}

const UPLOAD_KEY = "prev-employer";

const PreviousEmployerStep: React.FC<IPreviousEmployerStepProps> = ({
  data,
  onChange,
  showApproverComments,
  approverComments,
  onCommentChange,
  readOnly,
  attachments = {},
  onUpload,
  onDeleteAttachment,
}) => {
  const peAttachments = attachments[UPLOAD_KEY] || [];

  const handleFilesPicked = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (onUpload) await onUpload(UPLOAD_KEY, file);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepGrid}>
        <div className={styles.formGroup}>
          <label>Name of Employer</label>
          <InputField
            id="pe-name"
            value={data.employerName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerName", e.target.value)
            }
            placeholder="Enter name"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>PAN of Employer</label>
          <InputField
            id="pe-pan"
            value={data.employerPan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerPan", e.target.value)
            }
            placeholder="Enter PAN number"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Address of Employer</label>
          <InputField
            id="pe-address"
            value={data.employerAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerAddress", e.target.value)
            }
            placeholder="Enter address"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>TAN of Employer</label>
          <InputField
            id="pe-tan"
            value={data.employerTan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("employerTan", e.target.value)
            }
            placeholder="Enter TAN number"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Period of Employement From</label>
          <AppCalendar
            value={data.periodFrom ? new Date(data.periodFrom) : null}
            onChange={(e: any) => onChange("periodFrom", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Period of Employement TO</label>
          <AppCalendar
            value={data.periodTo ? new Date(data.periodTo) : null}
            onChange={(e: any) => onChange("periodTo", e.value)}
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Salary after exemption u/s 10</label>
          <InputField
            id="pe-salary"
            value={data.salaryAfterExemption}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("salaryAfterExemption", e.target.value)
            }
            placeholder="Enter"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Provident Fund Contribution</label>
          <InputField
            id="pe-pf"
            value={data.pfContribution}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("pfContribution", e.target.value)
            }
            placeholder="Enter"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>VPF, if any</label>
          <InputField
            id="pe-vpf"
            value={data.vpfContribution}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("vpfContribution", e.target.value)
            }
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Professional Tax, if any</label>
          <InputField
            id="pe-pt"
            value={data.professionalTax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("professionalTax", e.target.value)
            }
            placeholder="Select"
            disabled={readOnly}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Tax deduted at source</label>
          <InputField
            id="pe-tds"
            value={data.taxDeductedAtSource}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange("taxDeductedAtSource", e.target.value)
            }
            placeholder="Enter"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* ── Inline upload row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginTop: "24px",
        }}
      >
        {!readOnly && onUpload && peAttachments.length === 0 && (
          <AppFilePicker
            buttonLabel="Upload PDF"
            accept=".pdf"
            onChange={handleFilesPicked}
          />
        )}

        {peAttachments.map((att) => (
          <div
            key={att.Id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              color: "#475569",
              maxWidth: "260px",
            }}
          >
            <i
              className="pi pi-file-pdf"
              style={{ color: "#e11d48", fontSize: "12px" }}
            />
            <a
              href={att.FileRef}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#334155",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "180px",
              }}
              title={att.FileLeafRef}
            >
              {att.FileLeafRef.replace(/_\d{14}(\.pdf)$/i, "$1")}
            </a>
            {!readOnly && onDeleteAttachment && (
              <i
                className="pi pi-trash"
                style={{
                  color: "#e11d48",
                  cursor: "pointer",
                  fontSize: "11px",
                  flexShrink: 0,
                }}
                onClick={() => onDeleteAttachment(UPLOAD_KEY, att.Id)}
                title="Remove attachment"
              />
            )}
          </div>
        ))}
      </div>

      {showApproverComments && onCommentChange && (
        <div style={{ marginTop: "30px" }}>
          <div className={styles.formGroup}>
            <label>Approver Comments</label>
            <textarea
              className={styles.commentArea || ""}
              style={{
                width: "100%",
                height: "100px",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                resize: "none",
                fontSize: "14px",
              }}
              placeholder="Enter here"
              disabled={readOnly}
              value={approverComments}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousEmployerStep;
