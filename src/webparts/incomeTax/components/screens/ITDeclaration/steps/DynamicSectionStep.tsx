import * as React from "react";
import { InputField } from "../../../../../../CommonInputComponents";
import { AppFilePicker } from "../../../../../../CommonInputComponents/FilePicker";
import styles from "../ITDeclaration.module.scss";

interface IDynamicItem {
  id: number;
  section: string; // Subsection
  investmentType: string;
  maxAmount: number;
  declaredAmount: string;
  attachments?: any[];
}

interface IDynamicSectionStepProps {
  title: string;
  items: IDynamicItem[];
  sectionMaxAmount: number | null;
  onAmountChange: (id: number, val: string) => void;
  showApproverComments?: boolean;
  approverComments?: string;
  onCommentChange?: (val: string) => void;
  status?: string;
  readOnly?: boolean;
  onUpload?: (key: string, file: File) => void;
  onDeleteAttachment?: (key: string, fileId: number) => void;
}

const DynamicSectionStep: React.FC<IDynamicSectionStepProps> = ({
  title,
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
  // Determine if we should show the "Section" column
  const hasSubsections = React.useMemo(() => {
    return items.some((item) => item.section && item.section !== "-");
  }, [items]);

  return (
    <div>
      <div className={styles.stepHeader}>{title}</div>
      {sectionMaxAmount ? (
        <div className={styles.noteBox}>
          Note : Only <strong>Rs {sectionMaxAmount?.toLocaleString()}</strong>{" "}
          is deductible under this section
        </div>
      ) : null}

      <div className={styles.tableContainer}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              {hasSubsections && <th style={{ width: "20%" }}>Section</th>}
              <th style={{ width: hasSubsections ? "40%" : "50%" }}>
                Type of Investments
              </th>
              <th style={{ width: "20%" }}>Max Amount</th>
              <th style={{ width: "20%" }}>Amount</th>
              {onUpload && <th style={{ width: "20%" }}>Attachments</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {hasSubsections && (
                  <td>
                    <div
                      className={styles.readonlyValue}
                      style={{ background: "#f8fafc" }}
                    >
                      {item.section || "-"}
                    </div>
                  </td>
                )}
                <td>
                  <div
                    className={styles.readonlyValue}
                    style={{ border: "none" }}
                    title={item.investmentType}
                  >
                    {item.investmentType}
                  </div>
                </td>
                <td>
                  <div className={styles.readonlyValue}>
                    {Number(item.maxAmount || 0).toLocaleString()}
                  </div>
                </td>
                <td>
                  <InputField
                    id={`dynamic-amt-${item.id}`}
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
                {onUpload && (
                  <td>
                    <div>
                      {!readOnly &&
                        !(item.attachments && item.attachments.length > 0) && (
                          <AppFilePicker
                            buttonLabel="Upload PDF"
                            accept=".pdf"
                            onChange={(files: File[]) => {
                              const file = files[0];
                              if (file && onUpload) {
                                onUpload(`${title}-${item.id}`, file);
                              }
                            }}
                          />
                        )}

                      {item.attachments && item.attachments.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {item.attachments.map((att) => (
                            <div
                              key={att.Id || att.ID}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                cursor: "pointer",
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
                                onClick={() => {
                                  if (att.FileRef) {
                                    window.open(
                                      att.FileRef,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }
                                }}
                              />
                              <span
                                style={{
                                  color: "#334155",
                                  textDecoration: "none",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "100px",
                                }}
                                title={att.FileLeafRef}
                                onClick={() => {
                                  if (att.FileRef) {
                                    window.open(
                                      att.FileRef,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }
                                }}
                              >
                                {att.FileLeafRef
                                  ? att.FileLeafRef.replace(
                                      /_\d{14}(\.pdf)$/i,
                                      "$1",
                                    )
                                  : ""}
                              </span>
                              {!readOnly && onDeleteAttachment && (
                                <i
                                  className="pi pi-trash"
                                  style={{
                                    color: "#e11d48",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    flexShrink: 0,
                                  }}
                                  onClick={() =>
                                    onDeleteAttachment(title, att.Id || att.ID)
                                  }
                                  title="Remove attachment"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
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
                overflowY: "auto",
                fontSize: "14px",
                opacity: status === "Approved" ? 0.8 : 1,
                backgroundColor: "#fff",
              }}
              placeholder="Enter here"
              value={approverComments}
              disabled={status === "Approved" || status === "Rework"}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicSectionStep;
