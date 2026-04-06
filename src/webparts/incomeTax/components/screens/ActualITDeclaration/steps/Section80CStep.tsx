import * as React from "react";
import { InputField } from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface I80CItem {
  id: number;
  investmentType: string;
  maxAmount: number;
  declaredAmount: string;
  attachments?: any[];
}

interface ISection80CStepProps {
  items: I80CItem[];
  sectionMaxAmount: number | null;
  onAmountChange: (id: number, val: string) => void;
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  status?: string;
  readOnly?: boolean;
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (key: string, fileId: number) => Promise<void>;
}

const Section80CStep: React.FC<ISection80CStepProps> = ({
  items,
  sectionMaxAmount,
  onAmountChange,
  showApproverComments,
  approverComments,
  onCommentChange,
  status,
  readOnly,
  onUpload,
  onDeleteAttachment,
}) => {
  return (
    <div>
      <div className={styles.stepHeader}>Section 80C Deductions</div>
      {sectionMaxAmount && (
        <div className={styles.noteBox}>
          Note : Only <strong>Rs {sectionMaxAmount?.toLocaleString()}</strong>{" "}
          is deductible under this section
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th style={{ width: "35%" }}>Type of Investments</th>
              <th>Max Amount</th>
              <th>Amount</th>
              <th>Upload</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              // const uploadKey = `80c-${item.id}`;
              const uploadKey = `80c-${item.investmentType}`;
              const rowAttachments = item.attachments || [];
              return (
                <tr key={item.id}>
                  <td>
                    <div
                      className={styles.readonlyValue}
                      style={{
                        border: "none",
                      }}
                    >
                      {item.investmentType}
                    </div>
                  </td>
                  <td>
                    <div className={styles.readonlyValue}>
                      {item.maxAmount.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <InputField
                      id={`80c-amt-${item.id}`}
                      value={item.declaredAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onAmountChange(
                          item.id,
                          e.target.value.replace(/[^0-9]/g, "").slice(0, 7),
                        )
                      }
                      placeholder="Enter here"
                      disabled={readOnly}
                    />
                  </td>
                  <td style={{ minWidth: "180px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      {!readOnly && onUpload && rowAttachments.length === 0 && (
                        <AppFilePicker
                          buttonLabel="Upload"
                          accept=".pdf"
                          onChange={(files) => {
                            const file = files[0];
                            if (file && onUpload) {
                              void onUpload(uploadKey, file);
                            }
                          }}
                        />
                      )}

                      {rowAttachments.map((att) => (
                        <div
                          key={att.Id}
                          style={{
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "20px",
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            fontSize: "11px",
                            color: "#475569",
                            maxWidth: "200px",
                          }}
                        >
                          <i
                            className="pi pi-file-pdf"
                            style={{ color: "#e11d48", fontSize: "11px" }}
                            onClick={() =>
                              window.open(
                                att.FileRef,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          />
                          <span
                            onClick={() =>
                              window.open(
                                att.FileRef,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                            style={{
                              color: "#334155",
                              textDecoration: "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "120px",
                            }}
                            title={att.FileLeafRef}
                          >
                            {att.FileLeafRef.replace(/_\d{14}(\.pdf)$/i, "$1")}
                          </span>

                          {!readOnly && onDeleteAttachment && (
                            <i
                              className="pi pi-trash"
                              style={{
                                color: "#e11d48",
                                cursor: "pointer",
                                fontSize: "10px",
                                flexShrink: 0,
                              }}
                              onClick={() =>
                                onDeleteAttachment(uploadKey, att.Id)
                              }
                              title="Remove"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showApproverComments && onCommentChange && (
        <div style={{ marginTop: 10 }}>
          <div className={styles.formGroup}>
            <div className={styles.stepHeader}>Approver Comments</div>
            <textarea
              className={styles.commentArea || ""}
              style={{
                width: "100%",
                height: 80,
                padding: "16px",
                borderRadius: "12px",
                resize: "none",
                fontSize: "14px",
                pointerEvents: status === "Approved" ? "none" : "auto",
                opacity: status === "Approved" ? 0.8 : 1,
                backgroundColor: "#fff",
              }}
              placeholder="Enter here"
              value={approverComments}
              disabled={status === "Approved" || status == "Rework"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Section80CStep;
