import * as React from "react";
import { InputField } from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface I80DItem {
  id: number;
  section: string;
  investmentType: string;
  maxAmount: number;
  declaredAmount: string;
}

interface ISection80DStepProps {
  items: I80DItem[];
  sectionMaxAmount: number;
  showApproverComments?: boolean;
  approverComments: string;
  onAmountChange: (id: number, val: string) => void;
  onCommentChange: (val: string) => void;
  readOnly?: boolean;
  attachments?: Record<string, any[]>;
  onUpload?: (key: string, file: File) => Promise<void>;
  onDeleteAttachment?: (key: string, fileId: number) => Promise<void>;
}

const Section80DStep: React.FC<ISection80DStepProps> = ({
  items,
  sectionMaxAmount,
  showApproverComments,
  approverComments,
  onAmountChange,
  onCommentChange,
  readOnly,
  attachments = {},
  onUpload,
  onDeleteAttachment,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.noteBox}>
        Note : Only{" "}
        <strong>Rs {sectionMaxAmount?.toLocaleString() || "50,000"}</strong> is
        deductible under this section
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th>Section</th>
              <th style={{ width: "30%" }}>Type of Investments</th>
              <th>Max Amount</th>
              <th>Amount</th>
              <th>Upload</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const uploadKey = `80d-${item.id}`;
              const rowAttachments = attachments[uploadKey] || [];
              return (
                <tr key={item.id}>
                  <td>
                    <div
                      className={styles.readonlyValue}
                      style={{ background: "#f8fafc" }}
                    >
                      {item.section}
                    </div>
                  </td>
                  <td>
                    <div
                      className={styles.readonlyValue}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
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
                      id={`80d-amt-${item.id}`}
                      value={item.declaredAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onAmountChange(
                          item.id,
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      placeholder="0"
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
                              maxWidth: "120px",
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
                pointerEvents: "auto",
                opacity: 1,
              }}
              disabled={readOnly}
              placeholder="Enter here"
              value={approverComments}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Section80DStep;
